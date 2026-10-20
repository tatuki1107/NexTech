import { env } from "../env";
import { sqlClient } from "../db";
import { ApiError, authRequired, forbidden } from "./errors";

export type Role = "participant" | "organizer" | "admin";
export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  fullName: string | null;
  profileText: string | null;
  avatarUrl: string | null;
  status: string;
  roles: Role[];
};

type JwtPayload = { sub: string; jti: string; iss: string; aud: string; iat: number; exp: number };
const encoder = new TextEncoder();
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
export const REFRESH_COOKIE_NAME = "nextechRefreshToken";

const base64Url = (value: Uint8Array | string): string => {
  const bytes = typeof value === "string" ? encoder.encode(value) : value;
  return Buffer.from(bytes).toString("base64url");
};

const getJwtKey = () => crypto.subtle.importKey(
  "raw", encoder.encode(env.JWT_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"],
);

export const createAccessToken = async (userId: string): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    sub: userId, jti: crypto.randomUUID(), iss: env.JWT_ISSUER, aud: env.JWT_AUDIENCE,
    iat: now, exp: now + ACCESS_TOKEN_TTL_SECONDS,
  } satisfies JwtPayload));
  const unsigned = `${header}.${payload}`;
  const signature = await crypto.subtle.sign("HMAC", await getJwtKey(), encoder.encode(unsigned));
  return `${unsigned}.${base64Url(new Uint8Array(signature))}`;
};

export const verifyAccessToken = async (token: string): Promise<JwtPayload> => {
  const parts = token.split(".");
  if (parts.length !== 3) throw authRequired("アクセストークンが不正です");
  const [header, payload, signature] = parts as [string, string, string];
  try {
    const metadata = JSON.parse(Buffer.from(header, "base64url").toString("utf8")) as { alg?: string; typ?: string };
    if (metadata.alg !== "HS256" || metadata.typ !== "JWT") throw new Error("invalid header");
  } catch {
    throw authRequired("アクセストークンが不正です");
  }
  const isValid = await crypto.subtle.verify(
    "HMAC", await getJwtKey(), Buffer.from(signature, "base64url"), encoder.encode(`${header}.${payload}`),
  );
  if (!isValid) throw authRequired("アクセストークンが不正です");
  let claims: JwtPayload;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as JwtPayload;
  } catch {
    throw authRequired("アクセストークンが不正です");
  }
  const now = Math.floor(Date.now() / 1000);
  if (typeof claims.exp !== "number" || claims.exp <= now || claims.iss !== env.JWT_ISSUER || claims.aud !== env.JWT_AUDIENCE || !claims.sub) {
    throw authRequired("アクセストークンの有効期限が切れているか、対象が不正です");
  }
  return claims;
};

export const toPublicUser = (user: CurrentUser) => ({
  id: user.id, email: user.email, displayName: user.displayName, fullName: user.fullName,
  profileText: user.profileText, avatarUrl: user.avatarUrl, roles: user.roles, status: user.status,
});

export const getCurrentUser = async (authorization?: string | null, optional = false): Promise<CurrentUser | null> => {
  if (!authorization?.startsWith("Bearer ")) {
    if (optional) return null;
    throw authRequired();
  }
  const claims = await verifyAccessToken(authorization.slice(7));
  const rows = await sqlClient`
    SELECT u.id,u.email,u.display_name AS "displayName",u.full_name AS "fullName",
      u.profile_text AS "profileText",u.avatar_url AS "avatarUrl",u.status,
      COALESCE(array_agg(ur.role_code) FILTER (WHERE ur.role_code IS NOT NULL),'{}') AS roles
    FROM users u LEFT JOIN user_roles ur ON ur.user_id=u.id WHERE u.id=${claims.sub}
    GROUP BY u.id`;
  const user = rows[0] as CurrentUser | undefined;
  if (!user || user.status !== "active") throw authRequired("アカウントを利用できません");
  return user;
};

export const requireRole = (user: CurrentUser, role: Role): void => {
  if (!user.roles.includes(role)) throw forbidden();
};

const randomToken = (): string => base64Url(crypto.getRandomValues(new Uint8Array(32)));
export const hashToken = async (token: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  return Buffer.from(digest).toString("hex");
};

export const createRefreshSession = async (
  userId: string, userAgent?: string | null, ipAddress?: string | null, familyId = crypto.randomUUID(),
): Promise<{ token: string; sessionId: string; familyId: string }> => {
  const token = randomToken();
  const tokenHash = await hashToken(token);
  const [session] = await sqlClient`INSERT INTO auth_sessions
    (user_id,family_id,token_hash,expires_at,user_agent,ip_address)
    VALUES (${userId},${familyId},${tokenHash},now()+interval '30 days',${userAgent ?? null},${ipAddress ?? null})
    RETURNING id`;
  return { token, sessionId: session.id as string, familyId };
};

export const rotateRefreshSession = async (
  token: string, userAgent?: string | null, ipAddress?: string | null,
): Promise<{ token: string; accessToken: string; user: CurrentUser }> => {
  const tokenHash = await hashToken(token);
  const result = await sqlClient.begin(async (tx) => {
    const [current] = await tx`SELECT * FROM auth_sessions WHERE token_hash=${tokenHash} FOR UPDATE`;
    if (!current) throw authRequired("更新トークンが不正です");
    if (current.revoked_at) {
      await tx`UPDATE auth_sessions SET revoked_at=COALESCE(revoked_at,now()) WHERE family_id=${current.family_id}`;
      return { reused: true as const };
    }
    if (new Date(current.expires_at as string) <= new Date()) throw authRequired("更新トークンの有効期限が切れています");

    const newToken = randomToken();
    const newHash = await hashToken(newToken);
    const [replacement] = await tx`INSERT INTO auth_sessions
      (user_id,family_id,token_hash,expires_at,user_agent,ip_address)
      VALUES (${current.user_id},${current.family_id},${newHash},now()+interval '30 days',${userAgent ?? null},${ipAddress ?? null}) RETURNING id`;
    await tx`UPDATE auth_sessions SET revoked_at=now(),last_used_at=now(),replaced_by_id=${replacement.id} WHERE id=${current.id}`;
    const rows = await tx`SELECT u.id,u.email,u.display_name AS "displayName",u.full_name AS "fullName",
      u.profile_text AS "profileText",u.avatar_url AS "avatarUrl",u.status,
      COALESCE(array_agg(ur.role_code) FILTER (WHERE ur.role_code IS NOT NULL),'{}') AS roles
      FROM users u LEFT JOIN user_roles ur ON ur.user_id=u.id WHERE u.id=${current.user_id} GROUP BY u.id`;
    const user = rows[0] as CurrentUser | undefined;
    if (!user || user.status !== "active") throw authRequired("アカウントを利用できません");
    return { reused: false as const, token: newToken, accessToken: await createAccessToken(user.id), user };
  });
  if (result.reused) throw authRequired("更新トークンの再利用を検知しました");
  return result;
};

export const revokeRefreshSession = async (token?: string | null): Promise<void> => {
  if (!token) return;
  const hash = await hashToken(token);
  await sqlClient`UPDATE auth_sessions SET revoked_at=COALESCE(revoked_at,now()) WHERE token_hash=${hash}`;
};

export const authResponse = async (user: CurrentUser) => ({
  data: { accessToken: await createAccessToken(user.id), tokenType: "Bearer", expiresIn: ACCESS_TOKEN_TTL_SECONDS, user: toPublicUser(user) },
});

export const assertAllowedOrigin = (origin?: string | null): void => {
  if (origin && !env.ALLOWED_ORIGINS.includes(origin)) throw new ApiError(403, "FORBIDDEN", "許可されていない接続元です");
};
