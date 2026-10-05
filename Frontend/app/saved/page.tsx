"use client";

import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import { useEffect, useMemo, useState } from "react";
import { BOOKMARK_EVENT_NAME, readBookmarkedEventIds } from "../components/bookmark-button";
import { EventCard, UserShell } from "../components/user-shell";

type SavedTab = "開催予定" | "開催済み";

type ApiEvent = {
  id: string;
  title: string;
  format: string;
  venueName: string | null;
  startAt: string;
  endAt: string;
  categoryName: string;
  organizerName: string;
  seatsLeft: number;
};

function isApiEvent(value: unknown): value is ApiEvent {
  return typeof value === "object" && value !== null
    && "id" in value && typeof value.id === "string"
    && "title" in value && typeof value.title === "string"
    && "format" in value && typeof value.format === "string"
    && "venueName" in value && (typeof value.venueName === "string" || value.venueName === null)
    && "startAt" in value && typeof value.startAt === "string"
    && "endAt" in value && typeof value.endAt === "string"
    && "categoryName" in value && typeof value.categoryName === "string"
    && "organizerName" in value && typeof value.organizerName === "string"
    && "seatsLeft" in value && typeof value.seatsLeft === "number";
}

function formatEventDate(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "日時未定";
  const date = new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", weekday: "short" }).format(start);
  const time = (value: Date) => value.toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} ${time(start)} - ${time(end)}`;
}

export default function SavedPage() {
  const [activeTab, setActiveTab] = useState<SavedTab>("開催予定");
  const [bookmarkIds, setBookmarkIds] = useState<string[]>([]);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [referenceTime] = useState(() => Date.now());

  useEffect(() => {
    const syncBookmarkIds = () => setBookmarkIds(readBookmarkedEventIds());
    syncBookmarkIds();
    window.addEventListener(BOOKMARK_EVENT_NAME, syncBookmarkIds);
    return () => window.removeEventListener(BOOKMARK_EVENT_NAME, syncBookmarkIds);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("http://localhost:3001/api/events", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("イベント一覧を取得できませんでした。");
        const value: unknown = await response.json();
        if (!value || typeof value !== "object" || !("events" in value) || !Array.isArray(value.events) || !value.events.every(isApiEvent)) throw new Error("イベント一覧の形式が正しくありません。");
        setEvents(value.events);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setErrorMessage("保存済みイベントを読み込めませんでした。時間をおいて再度お試しください。");
      });
    return () => controller.abort();
  }, []);

  const bookmarkedEvents = useMemo(() => events.filter((event) => bookmarkIds.includes(event.id)), [bookmarkIds, events]);
  const upcomingEvents = useMemo(() => bookmarkedEvents.filter((event) => new Date(event.startAt).getTime() >= referenceTime), [bookmarkedEvents, referenceTime]);
  const pastEvents = useMemo(() => bookmarkedEvents.filter((event) => new Date(event.startAt).getTime() < referenceTime), [bookmarkedEvents, referenceTime]);
  const displayedEvents = activeTab === "開催予定" ? upcomingEvents : pastEvents;

  return <UserShell active="saved"><section className="saved-page"><h1>保存済みイベント</h1><div className="segmented-tabs"><button className={activeTab === "開催予定" ? "is-active" : ""} type="button" onClick={() => setActiveTab("開催予定")}>開催予定</button><button className={activeTab === "開催済み" ? "is-active" : ""} type="button" onClick={() => setActiveTab("開催済み")}>開催済み</button></div><div className="saved-list-header"><span>{displayedEvents.length}件</span><button type="button" aria-label="絞り込み"><FilterAltOutlinedIcon /></button></div>{errorMessage ? <p className="empty-state">{errorMessage}</p> : displayedEvents.length > 0 ? <div className="event-list">{displayedEvents.map((event) => <EventCard eventId={event.id} title={event.title} date={formatEventDate(event.startAt, event.endAt)} location={event.format === "online" ? "オンライン" : event.venueName ?? "会場未定"} category={event.categoryName} seatsLeft={event.seatsLeft} organizer={event.organizerName} key={event.id} />)}</div> : <p className="empty-state">{activeTab === "開催予定" ? "保存済みの開催予定イベントはありません。" : "保存済みの開催済みイベントはありません。"}</p>}</section></UserShell>;
}
