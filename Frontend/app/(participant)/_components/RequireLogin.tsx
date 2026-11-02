"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useParticipant } from "./ParticipantProvider";

export function RequireLogin({ children }: { children: ReactNode }) {
  const { user, loading, error, reload } = useParticipant();
  const pathname = usePathname();
  if (loading)
    return (
      <p className="empty-state" role="status">
        読み込み中…
      </p>
    );
  if (error)
    return (
      <div className="empty-state" role="alert">
        {error}
        <button onClick={() => void reload()} type="button">
          再試行
        </button>
      </div>
    );
  if (!user)
    return (
      <div className="empty-state">
        <p>ログインしてご利用ください。</p>
        <Link
          className="primary-button"
          href={`/login?returnTo=${encodeURIComponent(pathname)}`}
        >
          ログイン
        </Link>
      </div>
    );
  return children;
}
