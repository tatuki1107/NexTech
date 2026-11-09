const ACCESS_COOKIE = "nextechAccessToken";
const REFRESH_COOKIE = "nextechRefreshToken";
const uuid = "[0-9a-fA-F-]{36}";

export function isOrganizerEndpoint(path: string, method: string): boolean {
  const rules: Array<[string, RegExp]> = [
    ["GET", /^me\/organizers$/],
    ["POST", /^organizers$/],
    ["PATCH", new RegExp(`^organizers/${uuid}$`)],
    ["GET|POST", new RegExp(`^organizers/${uuid}/events$`)],
    [
      "GET",
      new RegExp(`^organizers/${uuid}/(members|analytics|events/${uuid})$`),
    ],
    ["PATCH", new RegExp(`^events/${uuid}(/status)?$`)],
    ["GET", new RegExp(`^events/${uuid}/(registrations|recruitment-summary)$`)],
    [
      "POST|DELETE",
      new RegExp(`^events/${uuid}/registrations/${uuid}/check-in$`),
    ],
  ];
  return rules.some(
    ([methods, pattern]) =>
      methods.split("|").includes(method) && pattern.test(path),
  );
}

export function isAdminEndpoint(path: string, method: string): boolean {
  if (method === "POST") return path === "admin/reviews";
  if (method === "PATCH")
    return new RegExp(`^admin/(events|organizers)/${uuid}/status$`).test(path);
  return method === "GET" && (
    /^admin\/moderation-actions$/.test(path) ||
    /^admin\/analytics\/(monthly-participants|breakdown)$/.test(path) ||
    new RegExp(`^admin/(events|organizers|registrations)(/${uuid})?$`).test(path)
  );
}

export function isParticipantEndpoint(path: string, method: string): boolean {
  const rules: Array<[string, RegExp]> = [
    ["POST", /^auth\/(signup|login|refresh|logout)$/],
    ["GET", /^(categories|tags|events|me)$/],
    ["PATCH", /^me$/],
    ["GET", new RegExp(`^(events|organizers)/${uuid}$`)],
    ["POST", new RegExp(`^events/${uuid}/registrations$`)],
    ["DELETE", new RegExp(`^events/${uuid}/registration$`)],
    [
      "GET",
      /^me\/(registrations|saved-events|favorite-categories|favorite-organizers|notifications|notification-settings|recommended-events)$/,
    ],
    ["PATCH", /^me\/notification-settings$/],
    ["PUT", /^me\/notifications\/read-all$/],
    ["PUT", new RegExp(`^me/notifications/${uuid}/read$`)],
    [
      "PUT|DELETE",
      new RegExp(
        `^me/(saved-events|favorite-categories|favorite-organizers)/${uuid}$`,
      ),
    ],
  ];
  return rules.some(
    ([methods, pattern]) =>
      methods.split("|").includes(method) && pattern.test(path),
  );
}

const error = (status: number, code: string, message: string) =>
  Response.json(
    { error: { code, message } },
    { status, headers: { "cache-control": "no-store" } },
  );

export async function proxyParticipantApi(
  request: Request,
  segments: string[],
  fetcher: typeof fetch = fetch,
  includeOrganizer = false,
): Promise<Response> {
  const path = segments.join("/");
  if (
    !isParticipantEndpoint(path, request.method) &&
    !(includeOrganizer && isOrganizerEndpoint(path, request.method)) &&
    !isAdminEndpoint(path, request.method)
  )
    return error(404, "NOT_FOUND", "APIが見つかりません");
  const url = new URL(request.url);
  // Next can use its internal hostname in request.url. Host is browser-controlled,
  // unlike forwarded-host, which must never decide the CSRF origin.
  const publicUrl = new URL(url);
  publicUrl.host = request.headers.get("host") ?? url.host;
  const protocol = request.headers.get("x-forwarded-proto");
  if (protocol === "http" || protocol === "https")
    publicUrl.protocol = protocol + ":";
  if (
    request.method !== "GET" &&
    request.headers.get("origin") !== publicUrl.origin
  )
    return error(403, "FORBIDDEN", "許可されていない接続元です");
  const cookies = new Map(
    (request.headers.get("cookie") ?? "").split(";").map((item) => {
      const index = item.indexOf("=");
      return [item.slice(0, index).trim(), item.slice(index + 1)];
    }),
  );
  const headers = new Headers({ accept: "application/json" });
  if (request.headers.has("content-type"))
    headers.set("content-type", request.headers.get("content-type")!);
  if (cookies.get(ACCESS_COOKIE))
    headers.set("authorization", `Bearer ${cookies.get(ACCESS_COOKIE)}`);
  if (path.startsWith("auth/") && cookies.get(REFRESH_COOKIE))
    headers.set("cookie", `${REFRESH_COOKIE}=${cookies.get(REFRESH_COOKIE)}`);
  try {
    const upstream = await fetcher(
      `${process.env.INTERNAL_API_BASE_URL ?? "http://localhost:3001"}/api/v1/${path}${url.search}`,
      {
        method: request.method,
        headers,
        cache: "no-store",
        redirect: "error",
        body: ["GET", "HEAD"].includes(request.method)
          ? undefined
          : await request.text(),
        signal: AbortSignal.timeout(10_000),
      },
    );
    const outgoing = new Headers({ "cache-control": "private, no-store" });
    const secure =
      url.protocol === "https:" || process.env.NODE_ENV === "production";
    const accessCookie = (token: string, age: number) =>
      `${ACCESS_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure ? "; Secure" : ""}`;
    if (path.startsWith("auth/")) {
      for (const cookie of upstream.headers.getSetCookie()) {
        if (cookie.startsWith(`${REFRESH_COOKIE}=`))
          outgoing.append("set-cookie", cookie);
      }
      if (
        (path === "auth/refresh" && upstream.status === 401) ||
        (path === "auth/logout" && upstream.ok)
      ) {
        outgoing.append("set-cookie", accessCookie("", 0));
      }
      if (upstream.ok && path !== "auth/logout") {
        const payload: unknown = await upstream.json();
        if (
          !payload ||
          typeof payload !== "object" ||
          !("data" in payload) ||
          !payload.data ||
          typeof payload.data !== "object" ||
          !("accessToken" in payload.data) ||
          typeof payload.data.accessToken !== "string" ||
          !/^[\w.-]+$/.test(payload.data.accessToken)
        ) {
          return error(
            502,
            "INVALID_RESPONSE",
            "認証情報を取得できませんでした",
          );
        }
        const { accessToken, ...data } = payload.data;
        outgoing.append("set-cookie", accessCookie(accessToken, 900));
        return Response.json(
          { data },
          { status: upstream.status, headers: outgoing },
        );
      }
    }
    if (upstream.status === 204)
      return new Response(null, { status: 204, headers: outgoing });
    if (upstream.status >= 500)
      return error(
        502,
        "API_UNAVAILABLE",
        "サーバーに接続できません。時間をおいて再度お試しください。",
      );
    return Response.json(await upstream.json(), {
      status: upstream.status,
      headers: outgoing,
    });
  } catch {
    return error(
      502,
      "API_UNAVAILABLE",
      "サーバーに接続できません。時間をおいて再度お試しください。",
    );
  }
}
