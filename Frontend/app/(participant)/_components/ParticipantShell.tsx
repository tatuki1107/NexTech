import Link from "next/link";
import type { ReactNode } from "react";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";

type NavigationItem = "search" | "saved" | "mypage";

type ParticipantShellProps = {
  active?: NavigationItem;
  children: ReactNode;
  title?: string;
  showBack?: boolean;
};

const navigationItems: Array<{
  id: NavigationItem;
  href: string;
  icon: ReactNode;
  label: string;
}> = [
  { id: "search", href: "/", icon: <SearchOutlinedIcon />, label: "探す" },
  {
    id: "saved",
    href: "/saved",
    icon: <BookmarkBorderOutlinedIcon />,
    label: "保存済み",
  },
  {
    id: "mypage",
    href: "/mypage",
    icon: <AccountCircleOutlinedIcon />,
    label: "マイページ",
  },
];

export function ParticipantShell({
  active = "search",
  children,
  title,
  showBack = false,
}: ParticipantShellProps) {
  return (
    <div className="user-app">
      <header className="user-header">
        {showBack ? (
          <Link className="back-link" href="/" aria-label="イベント一覧へ戻る">
            <ArrowBackIosNewRoundedIcon /> 戻る
          </Link>
        ) : (
          <Link href="/" className="brand" aria-label="NexTech ホーム">
            <span className="brand-mark">N</span>
            <span>exTech</span>
          </Link>
        )}
        {title ? <h1 className="header-title">{title}</h1> : null}
        {!showBack ? (
          <Link
            className="notification-link"
            href="/notifications"
            aria-label="通知を見る"
          >
            <NotificationsNoneOutlinedIcon />
            <span className="notification-dot" />
          </Link>
        ) : (
          <span className="header-spacer" />
        )}
      </header>
      <main className="user-content">{children}</main>
      <nav className="bottom-navigation" aria-label="参加者メニュー">
        {navigationItems.map((item) => (
          <Link
            className={`bottom-navigation-item ${active === item.id ? "is-active" : ""}`}
            href={item.href}
            key={item.id}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
