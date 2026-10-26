import { Elysia, t } from "elysia";
import { sqlClient } from "../db";
import { env } from "../env";
import {
  assertAllowedOrigin,
  authResponse,
  createRefreshSession,
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_TTL_SECONDS,
  revokeRefreshSession,
  rotateRefreshSession,
  toPublicUser,
  type CurrentUser,
} from "../lib/auth";
import { ApiError } from "../lib/errors";
import { assertRateLimit } from "../lib/rate-limit";

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/v1/auth",
  maxAge: REFRESH_TOKEN_TTL_SECONDS,
};

export const authRoutes = new Elysia({ prefix: "/auth" })
  .post(
    "/signup",
    async ({ body, cookie, headers, set, request, server }) => {
      const ipAddress = server?.requestIP(request)?.address ?? null;
      assertAllowedOrigin(headers.origin);
      assertRateLimit(`signup:${ipAddress ?? "unknown"}`, 10, 60_000);
      const email = body.email.trim().toLowerCase();
      const duplicate =
        await sqlClient`SELECT 1 FROM users WHERE lower(email)=${email}`;
      if (duplicate.length)
        throw new ApiError(
          409,
          "CONFLICT",
          "このメールアドレスは既に登録されています",
        );
      const passwordHash = await Bun.password.hash(body.password, "argon2id");
      const user = await sqlClient.begin(async (tx) => {
        const [created] =
          await tx`INSERT INTO users (email,password_hash,display_name,full_name)
        VALUES (${email},${passwordHash},${body.displayName},${body.fullName ?? null})
        RETURNING id,email,display_name AS "displayName",full_name AS "fullName",profile_text AS "profileText",
          avatar_url AS "avatarUrl",status`;
        await tx`INSERT INTO user_roles (user_id,role_code) VALUES (${created.id},'participant')`;
        await tx`INSERT INTO operation_logs (actor_user_id,action,resource_type,resource_id,user_agent,ip_address)
        VALUES (${created.id},'auth.signup','user',${created.id},${headers["user-agent"] ?? null},${ipAddress})`;
        return { ...created, roles: ["participant"] } as CurrentUser;
      });
      const session = await createRefreshSession(
        user.id,
        headers["user-agent"],
        ipAddress,
      );
      cookie[REFRESH_COOKIE_NAME].set({
        value: session.token,
        ...cookieOptions,
      });
      set.status = 201;
      return authResponse(user);
    },
    {
      body: t.Object({
        email: t.String({ format: "email", maxLength: 254 }),
        password: t.String({ minLength: 8, maxLength: 200 }),
        displayName: t.String({ minLength: 1, maxLength: 80 }),
        fullName: t.Optional(t.String({ maxLength: 100 })),
      }),
    },
  )
  .post(
    "/login",
    async ({ body, cookie, headers, request, server }) => {
      const ipAddress = server?.requestIP(request)?.address ?? null;
      assertAllowedOrigin(headers.origin);
      const email = body.email.trim().toLowerCase();
      assertRateLimit(`login-account:${email}`, 10, 60_000);
      assertRateLimit(`login-ip:${ipAddress ?? "unknown"}`, 100, 60_000);
      const rows =
        await sqlClient`SELECT u.id,u.email,u.password_hash AS "passwordHash",u.display_name AS "displayName",
      u.full_name AS "fullName",u.profile_text AS "profileText",u.avatar_url AS "avatarUrl",u.status,
      COALESCE(array_agg(ur.role_code) FILTER (WHERE ur.role_code IS NOT NULL),'{}') AS roles
      FROM users u LEFT JOIN user_roles ur ON ur.user_id=u.id WHERE lower(u.email)=${email} AND u.deleted_at IS NULL GROUP BY u.id`;
      const user = rows[0] as
        | (CurrentUser & { passwordHash: string })
        | undefined;
      if (
        !user ||
        user.status !== "active" ||
        !(await Bun.password.verify(body.password, user.passwordHash))
      ) {
        throw new ApiError(
          401,
          "AUTH_REQUIRED",
          "メールアドレスまたはパスワードが正しくありません",
        );
      }
      await sqlClient`UPDATE users SET last_login_at=now() WHERE id=${user.id}`;
      await sqlClient`INSERT INTO operation_logs (actor_user_id,action,resource_type,resource_id,user_agent,ip_address)
      VALUES (${user.id},'auth.login','user',${user.id},${headers["user-agent"] ?? null},${ipAddress})`;
      const session = await createRefreshSession(
        user.id,
        headers["user-agent"],
        ipAddress,
      );
      cookie[REFRESH_COOKIE_NAME].set({
        value: session.token,
        ...cookieOptions,
      });
      return authResponse(user);
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 1, maxLength: 200 }),
      }),
    },
  )
  .post("/refresh", async ({ cookie, headers, request, server }) => {
    const ipAddress = server?.requestIP(request)?.address ?? null;
    assertAllowedOrigin(headers.origin);
    assertRateLimit(`refresh:${ipAddress ?? "unknown"}`, 30, 60_000);
    const raw = cookie[REFRESH_COOKIE_NAME].value;
    if (typeof raw !== "string")
      throw new ApiError(401, "AUTH_REQUIRED", "更新トークンがありません");
    const rotated = await rotateRefreshSession(
      raw,
      headers["user-agent"],
      ipAddress,
    );
    cookie[REFRESH_COOKIE_NAME].set({ value: rotated.token, ...cookieOptions });
    return {
      data: {
        accessToken: rotated.accessToken,
        tokenType: "Bearer",
        expiresIn: 900,
        user: toPublicUser(rotated.user),
      },
    };
  })
  .post("/logout", async ({ cookie, headers, set }) => {
    assertAllowedOrigin(headers.origin);
    const raw = cookie[REFRESH_COOKIE_NAME].value;
    await revokeRefreshSession(typeof raw === "string" ? raw : null);
    cookie[REFRESH_COOKIE_NAME].set({ value: "", ...cookieOptions, maxAge: 0 });
    set.status = 204;
  });
