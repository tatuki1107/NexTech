export type ErrorCode =
  | "VERSION_CONFLICT"
  | "VALIDATION_ERROR"
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "REGISTRATION_CLOSED"
  | "BUSINESS_RULE_ERROR"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: Array<{ field?: string; message: string }>,
  ) {
    super(message);
  }
}

export const notFound = (message = "対象が見つかりません") =>
  new ApiError(404, "NOT_FOUND", message);
export const forbidden = (message = "この操作を行う権限がありません") =>
  new ApiError(403, "FORBIDDEN", message);
export const authRequired = (message = "認証が必要です") =>
  new ApiError(401, "AUTH_REQUIRED", message);

export const toErrorResponse = (error: ApiError) => ({
  error: {
    code: error.code,
    message: error.message,
    ...(error.details ? { details: error.details } : {}),
  },
});
