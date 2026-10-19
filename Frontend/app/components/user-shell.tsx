import Link from "next/link";
import type { ReactNode } from "react";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import { BookmarkButton } from "./bookmark-button";

type NavigationItem = "search" | "saved" | "mypage";

type UserShellProps = {
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
  { id: "saved", href: "/saved", icon: <BookmarkBorderOutlinedIcon />, label: "保存済み" },
  { id: "mypage", href: "/mypage", icon: <AccountCircleOutlinedIcon />, label: "マイページ" },
];

export function UserShell({
  active = "search",
  children,
  title,
  showBack = false,
}: UserShellProps) {
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
        {!showBack ? <Link className="notification-link" href="/notifications" aria-label="通知を見る"><NotificationsNoneOutlinedIcon /><span className="notification-dot" /></Link> : <span className="header-spacer" />}
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

export function EventImagePlaceholder({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`event-image ${compact ? "is-compact" : ""}`} aria-label="イベント画像未設定">
      <ImageNotSupportedOutlinedIcon />
      <small>NO IMAGE</small>
    </div>
  );
}

export function EventCard({
  eventId,
  title,
  date,
  location,
  category,
  seatsLeft,
  organizer,
}: {
  eventId: string;
  title: string;
  date: string;
  location: string;
  category: string;
  seatsLeft: number;
  organizer: string;
}) {
  return (
    <article className="event-card">
      <div className="event-card-topline">
        <span className="category-chip">{category}</span>
        <span className="seats-left">残り {seatsLeft} 席</span>
      </div>
      <EventImagePlaceholder />
      <div className="event-card-body">
        <h2>{title}</h2>
        <p><CalendarTodayOutlinedIcon /> {date}</p>
        <p><PlaceOutlinedIcon /> {location}</p>
        <p className="organizer-name"><HomeOutlinedIcon /> {organizer}</p>
      </div>
      <footer className="event-card-footer"><Link className="detail-button" href={`/events/${eventId}`}>詳細を見る</Link><BookmarkButton eventId={eventId} title={title} /></footer>
    </article>
  );
}
