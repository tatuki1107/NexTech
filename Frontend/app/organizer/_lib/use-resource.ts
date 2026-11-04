"use client";
import { useEffect, useState } from "react";
import { apiRequest, getAll, errorMessage } from "./api";
export function useResource<T>(path: string, paginated = false) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    path: string;
    revision: number;
    data?: T;
    error?: string;
  }>();
  useEffect(() => {
    const controller = new AbortController();
    const request = paginated
      ? getAll(path, controller.signal)
      : apiRequest<{ data: T }>(path, { signal: controller.signal }).then(
          (response) => response.data,
        );
    request
      .then((data) => {
        if (!controller.signal.aborted)
          setResult({ path, revision, data: data as T });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setResult({ path, revision, error: errorMessage(error) });
      });
    return () => controller.abort();
  }, [path, revision, paginated]);
  const current =
    result?.path === path && result.revision === revision ? result : undefined;
  return {
    data: current?.data,
    error: current?.error,
    reload: () => setRevision((value) => value + 1),
  };
}
