"use client";
import { useEffect, useReducer, useState } from "react";
import { apiRequest, getAll, errorMessage, ApiError } from "./api";
export function useApiData<T>(
  path: string,
  list = false,
  identity = "",
  enabled = true,
) {
  const [revision, reload] = useReducer((value) => value + 1, 0);
  const key = `${path}:${identity}:${revision}`;
  const [result, setResult] = useState<{
    key: string;
    data?: T;
    error?: string;
    errorStatus?: number;
  }>();
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const promise = list
      ? getAll(path, controller.signal)
      : apiRequest(path, { signal: controller.signal });
    promise
      .then((data) => {
        if (!controller.signal.aborted) setResult({ key, data: data as T });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setResult({
            key,
            error: errorMessage(error),
            errorStatus: error instanceof ApiError ? error.status : undefined,
          });
      });
    return () => controller.abort();
  }, [key, list, path, enabled]);
  return {
    data: result?.key === key ? result.data : undefined,
    error: result?.key === key ? result.error : undefined,
    errorStatus: result?.key === key ? result.errorStatus : undefined,
    loading: !enabled || result?.key !== key,
    reload,
  };
}
