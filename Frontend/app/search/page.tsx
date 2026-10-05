"use client";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { UserShell } from "../components/user-shell";

const dates = ["すべて", "今週", "今月", "日付指定"];
const tags = ["フロントエンド", "バックエンド", "生成AI", "UI/UX", "キャリア"];

type ApiEvent = {
  title: string;
  categoryName: string;
  organizerName: string;
  format: string;
  startAt: string;
};

function isApiEvent(value: unknown): value is ApiEvent {
  return typeof value === "object" && value !== null
    && "title" in value && typeof value.title === "string"
    && "categoryName" in value && typeof value.categoryName === "string"
    && "organizerName" in value && typeof value.organizerName === "string"
    && "format" in value && typeof value.format === "string"
    && "startAt" in value && typeof value.startAt === "string";
}

function matchesDateFilter(startAt: string, filter: string, referenceDate: Date) {
  const eventDate = new Date(startAt);
  if (Number.isNaN(eventDate.getTime()) || filter === "すべて" || filter === "日付指定") return true;
  if (filter === "今月") return eventDate.getFullYear() === referenceDate.getFullYear() && eventDate.getMonth() === referenceDate.getMonth();
  if (filter === "今週") {
    const startOfToday = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(startOfToday.getDate() + (7 - startOfToday.getDay()));
    return eventDate >= startOfToday && eventDate < endOfWeek;
  }
  return true;
}

export default function SearchPage() {
  const [keyword, setKeyword] = useState("");
  const [selectedDate, setSelectedDate] = useState("すべて");
  const [selectedTags, setSelectedTags] = useState<string[]>(["フロントエンド", "生成AI"]);
  const [selectedFormat, setSelectedFormat] = useState("すべて");
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [referenceDate] = useState(() => new Date());
  const toggleTag = (tag: string) => setSelectedTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  const resetFilters = () => {
    setKeyword("");
    setSelectedDate("すべて");
    setSelectedTags([]);
    setSelectedFormat("すべて");
  };
  const query = new URLSearchParams({
    ...(keyword ? { keyword } : {}),
    ...(selectedDate !== "すべて" ? { date: selectedDate } : {}),
    ...(selectedTags.length > 0 ? { tags: selectedTags.join(",") } : {}),
    ...(selectedFormat !== "すべて" ? { format: selectedFormat } : {}),
  });
  const resultHref = query.size > 0 ? `/?${query.toString()}` : "/";
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
        setEvents([]);
      })
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, []);
  const matchedEventCount = useMemo(() => events.filter((event) => {
    const searchableText = `${event.title} ${event.categoryName} ${event.organizerName}`.toLowerCase();
    const hasMatchingTag = selectedTags.length === 0 || selectedTags.includes(event.categoryName);
    const hasMatchingFormat = selectedFormat === "すべて" || (selectedFormat === "オンライン" ? event.format === "online" : event.format !== "online");
    return searchableText.includes(keyword.toLowerCase()) && hasMatchingTag && hasMatchingFormat && matchesDateFilter(event.startAt, selectedDate, referenceDate);
  }).length, [events, keyword, referenceDate, selectedDate, selectedFormat, selectedTags]);
  const resultButtonLabel = isLoading ? "イベントを検索中..." : `${matchedEventCount}件のイベントを見る`;
  return <UserShell active="search" showBack><section className="filter-page"><h1>検索条件</h1><label className="filter-label-text">キーワード<span className="keyword-field"><SearchOutlinedIcon /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="イベント名・主催者名で検索" /></span></label><h2>開催日</h2><div className="date-chip-grid">{dates.map((date) => <button className={selectedDate === date ? "is-selected" : ""} type="button" key={date} onClick={() => setSelectedDate(date)}>{date}</button>)}</div><h2>タグ</h2><div className="chip-grid">{tags.map((tag) => <button className={`filter-chip ${selectedTags.includes(tag) ? "is-selected" : ""}`} type="button" key={tag} onClick={() => toggleTag(tag)}>{tag}</button>)}</div><h2>開催形式</h2><div className="date-chip-grid">{["すべて", "オンライン", "会場開催"].map((format) => <button className={selectedFormat === format ? "is-selected" : ""} type="button" key={format} onClick={() => setSelectedFormat(format)}>{format}</button>)}</div><p className="search-condition-count">{isLoading ? "イベントを検索しています" : `現在の条件で ${matchedEventCount}件 見つかりました`}</p><div className="search-filter-actions"><button type="button" className="reset-filter-button" onClick={resetFilters}>リセット</button><Link href={resultHref} className="primary-button">{resultButtonLabel}</Link></div></section></UserShell>;
}
