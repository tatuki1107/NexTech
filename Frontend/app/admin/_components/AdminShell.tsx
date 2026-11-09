"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import EventOutlined from "@mui/icons-material/EventOutlined";
import BusinessOutlined from "@mui/icons-material/BusinessOutlined";
import GroupOutlined from "@mui/icons-material/GroupOutlined";
import HistoryOutlined from "@mui/icons-material/HistoryOutlined";
import BarChartOutlined from "@mui/icons-material/BarChartOutlined";
import {
  apiRequest,
  broadcastSessionChange,
  errorMessage,
} from "@/app/_lib/api";
import { useAdminData } from "../_lib/use-admin-data";
import styles from "../admin.module.css";

type User = { displayName: string; roles: string[] };
const loadUser = async (signal: AbortSignal) =>
  (await apiRequest<{ data: User }>("/me", { signal })).data;
const NAVIGATION = [
  { href: "/admin/events", label: "イベント", Icon: EventOutlined },
  { href: "/admin/organizers", label: "主催者", Icon: BusinessOutlined },
  { href: "/admin/registrations", label: "参加情報", Icon: GroupOutlined },
  { href: "/admin/history", label: "操作履歴", Icon: HistoryOutlined },
  { href: "/admin/analytics", label: "基本集計", Icon: BarChartOutlined },
];

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { result, reload } = useAdminData(loadUser);
  const [logoutError, setLogoutError] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  useEffect(() => {
    const channel =
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel("nextech-session");
    channel?.addEventListener("message", reload);
    const handleExpiry = () => {
      if (result.status === "ready") reload();
    };
    window.addEventListener("nextech-session-expired", handleExpiry);
    return () => {
      channel?.close();
      window.removeEventListener("nextech-session-expired", handleExpiry);
    };
  }, [reload, result.status]);

  async function handleLogout() {
    setIsSigningOut(true);
    setLogoutError("");
    try {
      await apiRequest("/auth/logout", { method: "POST" });
      broadcastSessionChange();
      window.location.assign("/admin/login");
    } catch (error) {
      setLogoutError(errorMessage(error));
      setIsSigningOut(false);
    }
  }

  const loginHref = `/admin/login?returnTo=${encodeURIComponent(pathname)}`;
  if (result.status === "loading")
    return (
      <main className={styles.gate} role="status">
        認証情報を確認しています…
      </main>
    );
  if (result.status === "error") {
    return (
      <main className={styles.gate}>
        <h1>
          {result.code === 401
            ? "管理者ログイン"
            : "認証情報を確認できませんでした"}
        </h1>
        {result.code === 401 ? (
          <Link className={styles.primary} href={loginHref}>
            ログインへ
          </Link>
        ) : (
          <>
            <p role="alert">{result.message}</p>
            <button className={styles.button} onClick={reload}>
              再試行
            </button>
          </>
        )}
      </main>
    );
  }
  if (!result.data.roles.includes("admin")) {
    return (
      <main className={styles.gate}>
        <h1>管理者権限が必要です</h1>
        <p>管理者権限のあるアカウントでログインしてください。</p>
        <Link className={styles.primary} href={loginHref}>
          別のアカウントでログイン
        </Link>
      </main>
    );
  }
  const name = result.data.displayName;
  return (
    <div className={styles.console}>
      <aside className={styles.sidebar}>
        <Link href="/admin/events" className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            N
          </span>
          <strong>NexTech</strong>
          <small>ADMIN</small>
        </Link>
        <nav aria-label="管理者メニュー">
          {NAVIGATION.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
              >
                <Icon aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className={styles.account}>
          <span className={styles.avatar} aria-hidden="true">
            AD
          </span>
          <div>
            <strong>{name}</strong>
            <small>運営管理者</small>
          </div>
          <button type="button" disabled={isSigningOut} onClick={handleLogout}>
            ログアウト
          </button>
          {logoutError && <p role="alert">{logoutError}</p>}
        </div>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
