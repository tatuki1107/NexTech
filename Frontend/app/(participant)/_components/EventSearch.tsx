"use client";

import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import Link from "next/link";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EventCard } from "@/app/(participant)/_components/EventCard";

type ApiEvent = {
  id: string;
  title: string;
  format: string;
  venueName: string | null;
  startAt: string;
  endAt: string;
  capacity: number;
  categoryName: string;
  organizerName: string;
  seatsLeft: number;
};

function isApiEvent(value: unknown): value is ApiEvent {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "title" in value &&
    typeof value.title === "string" &&
    "format" in value &&
    typeof value.format === "string" &&
    "venueName" in value &&
    (typeof value.venueName === "string" || value.venueName === null) &&
    "startAt" in value &&
    typeof value.startAt === "string" &&
    "endAt" in value &&
    typeof value.endAt === "string" &&
    "capacity" in value &&
    typeof value.capacity === "number" &&
    "categoryName" in value &&
    typeof value.categoryName === "string" &&
    "organizerName" in value &&
    typeof value.organizerName === "string" &&
    "seatsLeft" in value &&
    typeof value.seatsLeft === "number"
  );
}

function formatEventDate(startAt: string, endAt: string) {
  const startDate = new Date(startAt);
  const endDate = new Date(endAt);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()))
    return "日時未定";
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][
    startDate.getDay()
  ];
  return `${startDate.getMonth() + 1}/${startDate.getDate()}（${weekday}） ${startDate.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false })} - ${endDate.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
}

function matchesDateFilter(eventDate: Date, filter: string) {
  if (filter === "すべて" || filter === "日付指定") return true;
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  if (filter === "今月")
    return (
      eventDate.getFullYear() === now.getFullYear() &&
      eventDate.getMonth() === now.getMonth()
    );
  if (filter === "今週") {
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(startOfToday.getDate() + (7 - startOfToday.getDay()));
    return eventDate >= startOfToday && eventDate < endOfWeek;
  }
  return `${eventDate.getMonth() + 1}/${eventDate.getDate()}` === filter;
}

export function EventSearch() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [keyword, setKeyword] = useState(
    () => searchParams.get("keyword") ?? "",
  );
  const [date, setDate] = useState(() => searchParams.get("date") ?? "すべて");
  const [tag, setTag] = useState("すべて");
  const [location, setLocation] = useState(() =>
    searchParams.get("format") === "オンライン" ? "オンライン" : "すべて",
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/events", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok)
          throw new Error("イベント一覧を取得できませんでした。");
        const value: unknown = await response.json();
        if (
          !value ||
          typeof value !== "object" ||
          !("events" in value) ||
          !Array.isArray(value.events) ||
          !value.events.every(isApiEvent)
        )
          throw new Error("イベント一覧の形式が正しくありません。");
        setEvents(value.events);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setErrorMessage(
          "イベント一覧を読み込めませんでした。時間をおいて再度お試しください。",
        );
      });
    return () => controller.abort();
  }, []);

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        const searchableText =
          `${event.title} ${event.categoryName} ${event.organizerName}`.toLowerCase();
        const eventDate = new Date(event.startAt);
        const eventLocation =
          event.format === "online"
            ? "オンライン"
            : (event.venueName ?? "会場未定");
        const requestedTags =
          searchParams.get("tags")?.split(",").filter(Boolean) ?? [];
        const requestedFormat = searchParams.get("format");
        const hasMatchingTag =
          requestedTags.length === 0 ||
          requestedTags.includes(event.categoryName);
        const hasMatchingFormat =
          (requestedFormat !== "オンライン" &&
            requestedFormat !== "会場開催") ||
          (requestedFormat === "オンライン"
            ? event.format === "online"
            : event.format !== "online");
        return (
          searchableText.includes(keyword.toLowerCase()) &&
          hasMatchingTag &&
          hasMatchingFormat &&
          matchesDateFilter(eventDate, date) &&
          (tag === "すべて" || event.categoryName === tag) &&
          (location === "すべて" ||
            eventLocation === location ||
            (location === "オンライン" && event.format === "online"))
        );
      }),
    [date, events, keyword, location, searchParams, tag],
  );

  const tags = Array.from(new Set(events.map((event) => event.categoryName)));
  const locations = Array.from(
    new Set(
      events.map((event) =>
        event.format === "online"
          ? "オンライン"
          : (event.venueName ?? "会場未定"),
      ),
    ),
  );
  const dates = Array.from(
    new Set(
      events
        .map((event) => {
          const eventDate = new Date(event.startAt);
          return Number.isNaN(eventDate.getTime())
            ? ""
            : `${eventDate.getMonth() + 1}/${eventDate.getDate()}`;
        })
        .filter(Boolean),
    ),
  );
  const selectChangeHandler =
    (setter: (value: string) => void) =>
    (event: ChangeEvent<HTMLSelectElement>) =>
      setter(event.target.value);

  return (
    <>
      <section className="top-search-panel" aria-label="イベント検索">
        <label className="top-search-input">
          <SearchOutlinedIcon />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="イベント名、キーワードで検索"
          />
        </label>
        <div className="top-filter-row">
          <label>
            <span>開催日</span>
            <select value={date} onChange={selectChangeHandler(setDate)}>
              <option>すべて</option>
              {dates.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>タグ</span>
            <select value={tag} onChange={selectChangeHandler(setTag)}>
              <option>すべて</option>
              {tags.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>場所</span>
            <select
              value={location}
              onChange={selectChangeHandler(setLocation)}
            >
              <option>すべて</option>
              {locations.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
        <Link className="advanced-search-link" href="/search">
          <FilterAltOutlinedIcon />
          検索条件を詳しく設定
        </Link>
      </section>
      <section className="section-block" aria-labelledby="event-list-title">
        <div className="section-heading">
          <h2 id="event-list-title">おすすめイベント</h2>
          <span className="result-count">{filteredEvents.length}件</span>
        </div>
        {errorMessage ? (
          <p className="empty-state">{errorMessage}</p>
        ) : filteredEvents.length > 0 ? (
          <div className="event-list">
            {filteredEvents.map((event) => (
              <EventCard
                eventId={event.id}
                title={event.title}
                date={formatEventDate(event.startAt, event.endAt)}
                location={
                  event.format === "online"
                    ? "オンライン"
                    : (event.venueName ?? "会場未定")
                }
                category={event.categoryName}
                seatsLeft={event.seatsLeft}
                organizer={event.organizerName}
                key={event.id}
              />
            ))}
          </div>
        ) : (
          <p className="empty-state">
            現在、おすすめできるイベントはありません。
          </p>
        )}
      </section>
    </>
  );
}
