"use client";

import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
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
  applicationDeadline: string | null;
  capacity: number;
  categoryName: string;
  organizerName: string;
  seatsLeft: number;
};

type SortOption = "おすすめ" | "申し込み期間" | "残席順";

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
    "applicationDeadline" in value &&
    (typeof value.applicationDeadline === "string" ||
      value.applicationDeadline === null) &&
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

function sortEvents(events: ApiEvent[], sort: SortOption) {
  if (sort === "おすすめ") return events;

  return [...events].sort((firstEvent, secondEvent) => {
    if (sort === "残席順") return firstEvent.seatsLeft - secondEvent.seatsLeft;

    const firstDeadline = firstEvent.applicationDeadline
      ? new Date(firstEvent.applicationDeadline).getTime()
      : Number.POSITIVE_INFINITY;
    const secondDeadline = secondEvent.applicationDeadline
      ? new Date(secondEvent.applicationDeadline).getTime()
      : Number.POSITIVE_INFINITY;
    return firstDeadline - secondDeadline;
  });
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
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [advancedKeyword, setAdvancedKeyword] = useState("");
  const [advancedDate, setAdvancedDate] = useState("すべて");
  const [advancedTags, setAdvancedTags] = useState<string[]>([]);
  const [advancedFormat, setAdvancedFormat] = useState("すべて");
  const [advancedSort, setAdvancedSort] = useState<SortOption>("おすすめ");
  const [appliedTags, setAppliedTags] = useState<string[]>([]);
  const [appliedFormat, setAppliedFormat] = useState("すべて");
  const [appliedSort, setAppliedSort] = useState<SortOption>("おすすめ");
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

  const filteredEvents = useMemo(() => {
    const matchedEvents = events.filter((event) => {
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
        const hasAdvancedTag =
          appliedTags.length === 0 || appliedTags.includes(event.categoryName);
        const hasAdvancedFormat =
          appliedFormat === "すべて" ||
          (appliedFormat === "オンライン"
            ? event.format === "online"
            : event.format !== "online");
        return (
          searchableText.includes(keyword.toLowerCase()) &&
          hasMatchingTag &&
          hasMatchingFormat &&
          hasAdvancedTag &&
          hasAdvancedFormat &&
          matchesDateFilter(eventDate, date) &&
          (tag === "すべて" || event.categoryName === tag) &&
          (location === "すべて" ||
            eventLocation === location ||
            (location === "オンライン" && event.format === "online"))
        );
      });

    return sortEvents(matchedEvents, appliedSort);
  }, [
    appliedFormat,
    appliedSort,
    appliedTags,
    date,
    events,
    keyword,
    location,
    searchParams,
    tag,
  ]);

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
  const toggleAdvancedTag = (targetTag: string) => {
    setAdvancedTags((current) =>
      current.includes(targetTag)
        ? current.filter((item) => item !== targetTag)
        : [...current, targetTag],
    );
  };
  const advancedResultCount = events.filter((event) => {
    const searchableText =
      `${event.title} ${event.categoryName} ${event.organizerName}`.toLowerCase();
    const hasMatchingTag =
      advancedTags.length === 0 || advancedTags.includes(event.categoryName);
    const hasMatchingFormat =
      advancedFormat === "すべて" ||
      (advancedFormat === "オンライン"
        ? event.format === "online"
        : event.format !== "online");
    return (
      searchableText.includes(advancedKeyword.toLowerCase()) &&
      hasMatchingTag &&
      hasMatchingFormat &&
      matchesDateFilter(new Date(event.startAt), advancedDate)
    );
  }).length;
  const resetAdvancedSearch = () => {
    setAdvancedKeyword("");
    setAdvancedDate("すべて");
    setAdvancedTags([]);
    setAdvancedFormat("すべて");
    setAdvancedSort("おすすめ");
  };
  const applyAdvancedSearch = () => {
    setKeyword(advancedKeyword);
    setDate(advancedDate);
    setTag("すべて");
    setLocation("すべて");
    setAppliedTags(advancedTags);
    setAppliedFormat(advancedFormat);
    setAppliedSort(advancedSort);
    setIsAdvancedSearchOpen(false);
  };

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
        <button
          className="advanced-search-link"
          type="button"
          onClick={() => setIsAdvancedSearchOpen(true)}
        >
          <FilterAltOutlinedIcon />
          検索条件を詳しく設定
        </button>
      </section>
      {isAdvancedSearchOpen ? (
        <div
          className="search-modal-backdrop"
          role="presentation"
          onClick={() => setIsAdvancedSearchOpen(false)}
        >
          <section
            className="top-search-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="advanced-search-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-handle" />
            <header>
              <h2 id="advanced-search-title">検索条件</h2>
              <button
                type="button"
                aria-label="検索条件を閉じる"
                onClick={() => setIsAdvancedSearchOpen(false)}
              >
                <CloseOutlinedIcon />
              </button>
            </header>
            <div className="top-search-modal-content">
              <label className="filter-label-text">
                キーワード
                <span className="keyword-field">
                  <SearchOutlinedIcon />
                  <input
                    value={advancedKeyword}
                    onChange={(event) => setAdvancedKeyword(event.target.value)}
                    placeholder="イベント名・主催者名で検索"
                  />
                </span>
              </label>
              <h3>開催日</h3>
              <div className="date-chip-grid">
                {["すべて", "今週", "今月", "日付指定"].map((item) => (
                  <button
                    className={advancedDate === item ? "is-selected" : ""}
                    type="button"
                    key={item}
                    onClick={() => setAdvancedDate(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <h3>タグ</h3>
              <div className="chip-grid">
                {tags.map((item) => (
                  <button
                    className={`filter-chip ${advancedTags.includes(item) ? "is-selected" : ""}`}
                    type="button"
                    key={item}
                    onClick={() => toggleAdvancedTag(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <h3>開催形式</h3>
              <div className="date-chip-grid modal-format-grid">
                {["すべて", "オンライン", "会場開催"].map((item) => (
                  <button
                    className={advancedFormat === item ? "is-selected" : ""}
                    type="button"
                    key={item}
                    onClick={() => setAdvancedFormat(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <h3>並び替え</h3>
              <div className="date-chip-grid modal-sort-grid">
                {(["おすすめ", "申し込み期間", "残席順"] as SortOption[]).map(
                  (item) => (
                    <button
                      className={advancedSort === item ? "is-selected" : ""}
                      type="button"
                      key={item}
                      onClick={() => setAdvancedSort(item)}
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>
            </div>
            <footer>
              <button
                type="button"
                className="reset-filter-button"
                onClick={resetAdvancedSearch}
              >
                リセット
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={applyAdvancedSearch}
              >
                {advancedResultCount}件のイベントを見る
              </button>
            </footer>
          </section>
        </div>
      ) : null}
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
