import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { env } from "./env";
import { ApiError, toErrorResponse } from "./lib/errors";
import { authRoutes } from "./routes/auth";
import { meRoutes } from "./routes/me";
import { publicRoutes } from "./routes/public";
import { registrationRoutes } from "./routes/registrations";
import { organizerOperationsRoutes, organizerRoutes } from "./routes/organizers";
import { adminRoutes } from "./routes/admin";
import { docsRoutes } from "./routes/docs";
import { legacyRoutes } from "./routes/legacy";
import { meLibraryRoutes } from "./routes/me-library";
import { notificationRoutes } from "./routes/notifications";
import { managementRoutes } from "./routes/management";
import { analyticsRoutes } from "./routes/analytics";
import { UUID_PATTERN } from "./lib/validation";

export const createApp = () => new Elysia()
  .use(cors({ origin: env.ALLOWED_ORIGINS, credentials: true }))
  .onRequest(({ request, set }) => {
    const incomingId = request.headers.get("x-request-id");
    set.headers["x-request-id"] = incomingId && new RegExp(UUID_PATTERN).test(incomingId) ? incomingId : crypto.randomUUID();
  })
  .onError(({ error, code, set }) => {
    if (error instanceof ApiError) {
      set.status = error.status;
      return toErrorResponse(error);
    }
    if (code === "VALIDATION") {
      set.status = 400;
      return { error: { code: "VALIDATION_ERROR", message: "入力内容を確認してください" } };
    }
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: { code: "NOT_FOUND", message: "対象が見つかりません" } };
    }
    const databaseCode = "errno" in error ? String(error.errno) : "code" in error ? String(error.code) : "";
    if (["23505", "23503", "23514", "22001", "22P02"].includes(databaseCode)) {
      set.status = databaseCode === "23505" ? 409 : 422;
      return { error: { code: databaseCode === "23505" ? "CONFLICT" : "BUSINESS_RULE_ERROR", message: "入力内容またはデータの状態を確認してください" } };
    }
    const requestId = set.headers["x-request-id"];
    console.error(JSON.stringify({ level: "error", event: "request_failed", requestId }));
    set.status = 500;
    return { error: { code: "INTERNAL_ERROR", message: "サーバーエラーが発生しました" } };
  })
  .use(docsRoutes)
  .use(legacyRoutes)
  .get("/health", () => ({ status: "ok" }))
  .group("/api/v1", (api) => api
    .use(authRoutes)
    .use(meRoutes)
    .use(meLibraryRoutes)
    .use(notificationRoutes)
    .use(publicRoutes)
    .use(registrationRoutes)
    .use(organizerRoutes)
    .use(organizerOperationsRoutes)
    .use(adminRoutes)
    .use(managementRoutes)
    .use(analyticsRoutes));

export type App = ReturnType<typeof createApp>;
