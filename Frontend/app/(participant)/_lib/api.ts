export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function broadcastSessionChange() {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel("nextech-session");
  channel.postMessage("changed");
  channel.close();
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    const refresh = async () => {
      // Another tab/request may already have renewed the HttpOnly access cookie.
      const probe = await fetch("/api/v1/me", { cache: "no-store" });
      if (probe.ok) return true;
      if (probe.status !== 401)
        throw new ApiError(
          502,
          "認証状態を確認できません。再度お試しください。",
        );
      const response = await fetch("/api/v1/auth/refresh", { method: "POST" });
      if (!response.ok && response.status !== 401)
        throw new ApiError(
          502,
          "ログイン状態を更新できません。再度お試しください。",
        );
      return response.ok;
    };
    refreshPromise = (async () => {
      if (typeof navigator !== "undefined" && navigator.locks)
        return await navigator.locks.request("nextech-refresh", refresh);
      return await refresh();
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const send = () =>
    fetch(`/api/v1${path}`, {
      ...init,
      cache: "no-store",
      headers: { "content-type": "application/json", ...init.headers },
    });
  let response = await send();
  if (response.status === 401 && !path.startsWith("/auth/")) {
    if (await refreshSession()) response = await send();
    else if (typeof window !== "undefined")
      window.dispatchEvent(new Event("nextech-session-expired"));
  }
  if (response.status === 204) return undefined as T;
  const payload: unknown = await response.json();
  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "error" in payload
        ? payload.error
        : null;
    const message =
      detail &&
      typeof detail === "object" &&
      "message" in detail &&
      typeof detail.message === "string"
        ? detail.message
        : "処理に失敗しました。";
    throw new ApiError(response.status, message);
  }
  return payload as T;
}

export type PageResult<T> = {
  data: T[];
  pagination: { page: number; perPage: number; total: number };
};

export async function getAll<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 1; ; page++) {
    const result = await apiRequest<PageResult<T>>(
      `${path}${path.includes("?") ? "&" : "?"}perPage=100&page=${page}`,
      { signal },
    );
    rows.push(...result.data);
    if (
      page * result.pagination.perPage >= result.pagination.total ||
      !result.data.length
    )
      return rows;
  }
}

export function safeReturnTo(value: string | null): string {
  return value?.startsWith("/") &&
    !value.startsWith("//") &&
    !/[\\\r\n]/.test(value)
    ? value
    : "/mypage";
}

export const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "処理に失敗しました。再度お試しください。";
