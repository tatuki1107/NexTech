"use client";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getPublicEvents } from "../_lib/event-list";
import { matchesEventFormat, type EventFormatFilter } from "../_lib/event-format";
import { EventFormatOptions } from "../_components/EventFormatOptions";
import { ParticipantShell } from "@/app/(participant)/_components/ParticipantShell";

const dates = ["すべて", "今週", "今月", "日付指定"];

type ApiEvent = {
  tagNames?: string[];
  title: string;
  categoryName: string;
  organizerName: string;
  format: string;
  startAt: string;
};

function matchesDateFilter(
  startAt: string,
  filter: string,
  referenceDate: Date,
) {
  const eventDate = new Date(startAt);
  if (
    Number.isNaN(eventDate.getTime()) ||
    filter === "すべて" ||
    filter === "日付指定"
  )
    return true;
  if (filter === "今月")
    return (
      eventDate.getFullYear() === referenceDate.getFullYear() &&
      eventDate.getMonth() === referenceDate.getMonth()
    );
  if (filter === "今週") {
    const startOfToday = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate(),
    );
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(startOfToday.getDate() + (7 - startOfToday.getDay()));
    return eventDate >= startOfToday && eventDate < endOfWeek;
  }
  return true;
}

export default function SearchPage() {
  const [keyword, setKeyword] = useState("");
  const [selectedDate, setSelectedDate] = useState("すべて");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<EventFormatFilter>("all");
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const tags = [
    ...new Set(
      events.flatMap((event) => [
        event.categoryName,
        ...(event.tagNames ?? []),
      ]),
    ),
  ];
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [referenceDate] = useState(() => new Date());
  const toggleTag = (tag: string) =>
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  const resetFilters = () => {
    setKeyword("");
    setSelectedDate("すべて");
    setSelectedTags([]);
    setSelectedFormat("all");
  };
  const query = new URLSearchParams({
    ...(keyword ? { keyword } : {}),
    ...(selectedDate !== "すべて" ? { date: selectedDate } : {}),
    ...(selectedTags.length > 0 ? { tags: selectedTags.join(",") } : {}),
    ...(selectedFormat !== "all" ? { format: selectedFormat } : {}),
  });
  const resultHref = query.size > 0 ? `/?${query.toString()}` : "/";
  useEffect(() => {
    const controller = new AbortController();
    getPublicEvents(controller.signal)
      .then(setEvents)
      .catch(() => {
        if (controller.signal.aborted) return;
        setErrorMessage("イベントを取得できませんでした。再度お試しください。");
      })
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, []);
  const matchedEventCount = useMemo(
    () =>
      events.filter((event) => {
        const searchableText =
          `${event.title} ${event.categoryName} ${event.organizerName}`.toLowerCase();
        const hasMatchingTag =
          selectedTags.length === 0 ||
          [event.categoryName, ...(event.tagNames ?? [])].some((tag) =>
            selectedTags.includes(tag),
          );
        const hasMatchingFormat = matchesEventFormat(event.format, selectedFormat);
        return (
          searchableText.includes(keyword.toLowerCase()) &&
          hasMatchingTag &&
          hasMatchingFormat &&
          matchesDateFilter(event.startAt, selectedDate, referenceDate)
        );
      }).length,
    [
      events,
      keyword,
      referenceDate,
      selectedDate,
      selectedFormat,
      selectedTags,
    ],
  );
  const resultButtonLabel = isLoading
    ? "イベントを検索中..."
    : `${matchedEventCount}件のイベントを見る`;
  return (
    <ParticipantShell active="search" showBack>
      <section className="filter-page">
        <h1>検索条件</h1>
        {errorMessage && <p role="alert">{errorMessage}</p>}
        <label className="filter-label-text">
          キーワード
          <span className="keyword-field">
            <SearchOutlinedIcon />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="イベント名・主催者名で検索"
            />
          </span>
        </label>
        <h2>開催日</h2>
        <div className="date-chip-grid">
          {dates.map((date) => (
            <button
              className={selectedDate === date ? "is-selected" : ""}
              type="button"
              key={date}
              onClick={() => setSelectedDate(date)}
            >
              {date}
            </button>
          ))}
        </div>
        <h2>タグ</h2>
        <div className="chip-grid">
          {tags.map((tag) => (
            <button
              className={`filter-chip ${selectedTags.includes(tag) ? "is-selected" : ""}`}
              type="button"
              key={tag}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
        <h2>開催形式</h2>
        <EventFormatOptions value={selectedFormat} onChange={setSelectedFormat} />
        <p className="search-condition-count">
          {isLoading
            ? "イベントを検索しています"
            : `現在の条件で ${matchedEventCount}件 見つかりました`}
        </p>
        <div className="search-filter-actions">
          <button
            type="button"
            className="reset-filter-button"
            onClick={resetFilters}
          >
            リセット
          </button>
          <Link href={resultHref} className="primary-button">
            {resultButtonLabel}
          </Link>
        </div>
      </section>
    </ParticipantShell>
  );
}
