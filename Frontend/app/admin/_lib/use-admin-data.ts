"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, errorMessage } from "@/app/_lib/api";

type Result<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; message: string; code?: number };

export function useAdminData<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  const [state, setState] = useState<{
    load: typeof load;
    revision: number;
    result: Result<T>;
  }>();
  useEffect(() => {
    const controller = new AbortController();
    const settle = (result: Result<T>) => {
      if (!controller.signal.aborted) setState({ load, revision, result });
    };
    load(controller.signal).then(
      (data) => settle({ status: "ready", data }),
      (error: unknown) =>
        settle({
          status: "error",
          message: errorMessage(error),
          code: error instanceof ApiError ? error.status : undefined,
        }),
    );
    return () => controller.abort();
  }, [load, revision]);
  const result: Result<T> =
    state?.load === load && state.revision === revision
      ? state.result
      : { status: "loading" };
  return { result, reload };
}
