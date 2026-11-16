"use client";

import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getPublicEvents } from "../_lib/event-list";
import { matchesEventFilters, quickDateLabel, type EventFilters } from "../_lib/event-search-filter";
import { formatEventDate } from "../_lib/event-detail";
import { tokyoDate } from "@/app/_lib/calendar-date";
import {
  DEFAULT_EVENT_FILTERS,
  readEventSearchQuery,
  updateEventSearchQuery,
} from "../_lib/event-search-query";
import {
  getEventFormatLabel,
  type EventFormatFilter,
} from "../_lib/event-format";
import { EventCard } from "@/app/(participant)/_components/EventCard";
import { EventQuickFilter } from "./EventQuickFilter";
import { EventFormatOptions } from "./EventFormatOptions";

type ApiEvent = {
  tagNames?: string[];
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
  const [appliedFilters, setAppliedFilters] = useState(() =>
    readEventSearchQuery(searchParams),
  );
  const { keyword, date, dateFrom = "", dateTo = "", tags: appliedTags, format: appliedFormat } = appliedFilters;
  const [tag, setTag] = useState("すべて");
  const [location, setLocation] = useState("すべて");
  const [linkedSearch] = useState(() => searchParams.get("filters") === "open");
  const [modalState, setModalState] = useState<"closed" | "open" | "closing">(
    linkedSearch ? "open" : "closed",
  );
  const isSpecificDate = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const advancedSearchTrigger = useRef<HTMLButtonElement>(null);
  const advancedSearchClose = useRef<HTMLButtonElement>(null);
  const keywordInput = useRef<HTMLInputElement>(null);
  const [advancedKeyword, setAdvancedKeyword] = useState(keyword);
  const [advancedDate, setAdvancedDate] = useState(dateFrom || dateTo ? "期間指定" : isSpecificDate ? "日付指定" : date);
  const [advancedSpecificDate, setAdvancedSpecificDate] = useState(isSpecificDate ? date : "");
  const [advancedFrom, setAdvancedFrom] = useState(dateFrom);
  const [advancedTo, setAdvancedTo] = useState(dateTo);
  const [advancedTags, setAdvancedTags] = useState(appliedTags);
  const [advancedFormat, setAdvancedFormat] = useState<EventFormatFilter>(appliedFormat);
  const [advancedSort, setAdvancedSort] = useState<SortOption>("おすすめ");
  const [appliedSort, setAppliedSort] = useState<SortOption>("おすすめ");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (modalState === "open") {
      advancedSearchClose.current?.focus({ preventScroll: true });
    }
  }, [modalState]);

  useEffect(() => {
    const controller = new AbortController();
    getPublicEvents(controller.signal)
      .then(setEvents)
      .catch(() => {
        if (controller.signal.aborted) return;
        setErrorMessage(
          "イベント一覧を読み込めませんでした。時間をおいて再度お試しください。",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, []);

  const filteredEvents = useMemo(() => {
    const matchedEvents = events.filter((event) => {
      const eventLocation =
        event.format === "online"
          ? "オンライン"
          : (event.venueName ?? "会場未定");
      return (
        matchesEventFilters(event, {
          keyword,
          date,
          dateFrom,
          dateTo,
          tags: appliedTags,
          format: appliedFormat,
        }) &&
        (tag === "すべて" ||
          event.categoryName === tag ||
          event.tagNames?.includes(tag)) &&
        (location === "すべて" || eventLocation === location)
      );
    });

    return sortEvents(matchedEvents, appliedSort);
  }, [
    appliedFormat,
    appliedSort,
    appliedTags,
    date,
    dateFrom,
    dateTo,
    events,
    keyword,
    location,
    tag,
  ]);

  const tags = Array.from(
    new Set(
      events.flatMap((event) => [
        event.categoryName,
        ...(event.tagNames ?? []),
      ]),
    ),
  );
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
        .map((event) => quickDateLabel(tokyoDate(new Date(event.startAt))))
        .filter(Boolean),
    ),
  );
  const toggleAdvancedTag = (targetTag: string) => {
    setAdvancedTags((current) =>
      current.includes(targetTag)
        ? current.filter((item) => item !== targetTag)
        : [...current, targetTag],
    );
  };
  const isDateRange = advancedDate === "期間指定";
  const invalidRange = isDateRange && Boolean(advancedFrom && advancedTo && advancedFrom > advancedTo);
  const advancedResultCount = events.filter((event) =>
    matchesEventFilters(event, {
      keyword: advancedKeyword,
      date: isDateRange ? "すべて" : advancedDate === "日付指定" ? advancedSpecificDate : advancedDate,
      dateFrom: isDateRange ? advancedFrom : "",
      dateTo: isDateRange ? advancedTo : "",
      tags: advancedTags,
      format: advancedFormat,
    }),
  ).length;
  const resetAdvancedSearch = () => {
    setAdvancedKeyword("");
    setAdvancedDate("すべて");
    setAdvancedSpecificDate("");
    setAdvancedFrom("");
    setAdvancedTo("");
    setAdvancedTags([]);
    setAdvancedFormat("all");
    setAdvancedSort("おすすめ");
  };
  const closeAdvancedSearch = () => {
    setModalState((current) => current === "open" ? "closing" : current);
    const url = new URL(window.location.href);
    if (url.searchParams.has("filters")) {
      url.searchParams.delete("filters");
      window.history.replaceState(null, "", url);
    }
  };
  const updateAppliedSearch = (changes: Partial<EventFilters>) => {
    setAppliedFilters((current) => ({ ...current, ...changes }));
    const url = new URL(window.location.href);
    const updated = updateEventSearchQuery(url.searchParams, changes, linkedSearch).toString();
    if (updated === url.searchParams.toString()) return;
    url.search = updated;
    window.history.replaceState(null, "", url);
  };
  const applyAdvancedSearch = () => {
    if (invalidRange) return;
    updateAppliedSearch({
      keyword: advancedKeyword,
      date: isDateRange ? "すべて" : advancedDate === "日付指定" ? advancedSpecificDate : advancedDate,
      dateFrom: isDateRange ? advancedFrom : "",
      dateTo: isDateRange ? advancedTo : "",
      tags: advancedTags,
      format: advancedFormat,
    });
    setTag("すべて");
    setLocation("すべて");
    setAppliedSort(advancedSort);
    closeAdvancedSearch();
  };
  const resetAppliedSearch = () => {
    updateAppliedSearch(DEFAULT_EVENT_FILTERS);
    setTag("すべて");
    setLocation("すべて");
    setAppliedSort("おすすめ");
    keywordInput.current?.focus();
  };

  const activeConditions: {
    id: string;
    text: string;
    clear: () => void;
  }[] = [];
  if (keyword.trim()) {
    activeConditions.push({ id: "keyword", text: `キーワード：${keyword.trim()}`, clear: () => updateAppliedSearch({ keyword: "" }) });
  }
  if (dateFrom || dateTo) {
    activeConditions.push({
      id: "date-range",
      text: `開催期間：${dateFrom || "指定なし"} 〜 ${dateTo || "指定なし"}`,
      clear: () => updateAppliedSearch({ date: "すべて", dateFrom: "", dateTo: "" }),
    });
  } else if (date !== "すべて") {
    activeConditions.push({ id: "date", text: `開催日：${date}`, clear: () => updateAppliedSearch({ date: "すべて" }) });
  }
  if (tag !== "すべて") {
    activeConditions.push({
      id: "quick-tag",
      text: `${appliedTags.length ? "タグ（簡易）" : "タグ"}：${tag}`,
      clear: () => setTag("すべて"),
    });
  }
  for (const appliedTag of appliedTags) {
    activeConditions.push({
      id: `tag:${appliedTag}`,
      text: `タグ：${appliedTag}`,
      clear: () => updateAppliedSearch({ tags: appliedTags.filter((item) => item !== appliedTag) }),
    });
  }
  if (location !== "すべて") {
    activeConditions.push({ id: "location", text: `場所：${location}`, clear: () => setLocation("すべて") });
  }
  const formatLabel = getEventFormatLabel(appliedFormat);
  if (formatLabel) {
    activeConditions.push({ id: "format", text: `開催形式：${formatLabel}`, clear: () => updateAppliedSearch({ format: "all" }) });
  }
  if (appliedSort !== "おすすめ") {
    activeConditions.push({ id: "sort", text: `並び替え：${appliedSort}`, clear: () => setAppliedSort("おすすめ") });
  }

  return (
    <>
      <section className="top-search-panel" aria-label="イベント検索">
        <label className="top-search-input">
          <SearchOutlinedIcon />
          <input
            ref={keywordInput}
            value={keyword}
            onChange={(event) => updateAppliedSearch({ keyword: event.target.value })}
            aria-label="イベント名、キーワードで検索"
            placeholder="イベント名、キーワードで検索"
          />
        </label>
        <div className="top-filter-row">
          <EventQuickFilter label="開催日" value={date} choices={dates} onChange={(value) => updateAppliedSearch({ date: value, dateFrom: "", dateTo: "" })} />
          <EventQuickFilter label="タグ" value={tag} choices={tags} onChange={setTag} />
          <EventQuickFilter label="場所" value={location} choices={locations} onChange={setLocation} />
        </div>
        <button
          ref={advancedSearchTrigger}
          className="advanced-search-link"
          type="button"
          aria-haspopup="dialog"
          onClick={() => {
            setAdvancedKeyword(keyword);
            setAdvancedDate(
              dateFrom || dateTo ? "期間指定" : /^\d{4}-\d{2}-\d{2}$/.test(date) ? "日付指定" : date,
            );
            setAdvancedSpecificDate(
              /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "",
            );
            setAdvancedFrom(dateFrom);
            setAdvancedTo(dateTo);
            setAdvancedTags(tag === "すべて" ? appliedTags : [tag]);
            setAdvancedFormat(
              appliedFormat === "all" && location === "オンライン" ? "online" : appliedFormat,
            );
            setAdvancedSort(appliedSort);
            setModalState("open");
          }}
        >
          <FilterAltOutlinedIcon />
          検索条件を詳しく設定
        </button>
      </section>
      {modalState !== "closed" ? (
        <div
          className="search-modal-backdrop"
          data-closing={modalState === "closing" || undefined}
          role="presentation"
          onClick={closeAdvancedSearch}
          onAnimationEnd={(event) => {
            if (event.target !== event.currentTarget || modalState !== "closing") return;
            setModalState("closed");
            advancedSearchTrigger.current?.focus({ preventScroll: true });
          }}
        >
          <section
            className="top-search-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="advanced-search-title"
            inert={modalState === "closing"}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                closeAdvancedSearch();
              }
              if (event.key !== "Tab") return;
              const controls = event.currentTarget.querySelectorAll<HTMLElement>(
                "button:not(:disabled), input:not(:disabled)",
              );
              const first = controls[0];
              const last = controls[controls.length - 1];
              if (event.shiftKey && event.target === first) {
                event.preventDefault();
                last?.focus();
              } else if (!event.shiftKey && event.target === last) {
                event.preventDefault();
                first?.focus();
              }
            }}
          >
            <div className="modal-handle" />
            <header>
              <h2 id="advanced-search-title">検索条件</h2>
              <button
                ref={advancedSearchClose}
                type="button"
                aria-label="検索条件を閉じる"
                onClick={closeAdvancedSearch}
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
                {["すべて", "今週", "今月", "日付指定", "期間指定"].map((item) => (
                  <button
                    className={advancedDate === item ? "is-selected" : ""}
                    aria-pressed={advancedDate === item}
                    type="button"
                    key={item}
                    onClick={() => setAdvancedDate(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              {advancedDate === "日付指定" && (
                <label className="filter-label-text">
                  開催日を指定
                  <input
                    type="date"
                    value={advancedSpecificDate}
                    onChange={(event) =>
                      setAdvancedSpecificDate(event.target.value)
                    }
                  />
                </label>
              )}
              {isDateRange && (
                <>
                  <label className="filter-label-text">開始日（JST）
                    <input type="date" value={advancedFrom} onChange={(event) => setAdvancedFrom(event.target.value)} />
                  </label>
                  <label className="filter-label-text">終了日（JST）
                    <input type="date" value={advancedTo} onChange={(event) => setAdvancedTo(event.target.value)} />
                  </label>
                  {invalidRange && <p role="alert">終了日を開始日以降にしてください。</p>}
                </>
              )}
              <h3>タグ</h3>
              <div className="chip-grid">
                {tags.map((item) => (
                  <button
                    className={`filter-chip ${advancedTags.includes(item) ? "is-selected" : ""}`}
                    aria-pressed={advancedTags.includes(item)}
                    type="button"
                    key={item}
                    onClick={() => toggleAdvancedTag(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <h3>開催形式</h3>
              <EventFormatOptions value={advancedFormat} onChange={setAdvancedFormat} />
              <h3>並び替え</h3>
              <div className="date-chip-grid modal-sort-grid">
                {(["おすすめ", "申し込み期間", "残席順"] as SortOption[]).map(
                  (item) => (
                    <button
                      className={advancedSort === item ? "is-selected" : ""}
                      aria-pressed={advancedSort === item}
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
                disabled={invalidRange || (isDateRange && !advancedFrom && !advancedTo) || (advancedDate === "日付指定" && !advancedSpecificDate)}
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
          <span className="result-count" role="status">{filteredEvents.length}件</span>
        </div>
        {activeConditions.length > 0 && (
          <div className="applied-search">
            <h3 id="applied-search-title">適用中の条件</h3>
            <ul aria-labelledby="applied-search-title">
              {activeConditions.map((condition) => (
                <li key={condition.id}>
                  <button
                    type="button"
                    aria-label={`${condition.text}を解除`}
                    onClick={(event) => {
                      const item = event.currentTarget.parentElement;
                      const sibling = item?.nextElementSibling ?? item?.previousElementSibling;
                      const target = sibling?.querySelector("button") ?? advancedSearchTrigger.current;
                      condition.clear();
                      target?.focus({ preventScroll: true });
                    }}
                  >
                    <span>{condition.text}</span>
                    <CloseOutlinedIcon aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {isLoading ? (
          <p className="empty-state" role="status">
            イベントを読み込み中…
          </p>
        ) : errorMessage ? (
          <p className="empty-state">{errorMessage}</p>
        ) : filteredEvents.length > 0 ? (
          <div className="event-list">
            {filteredEvents.map((event) => (
              <EventCard
                eventId={event.id}
                title={event.title}
                date={formatEventDate(event.startAt, event.endAt)}
                format={event.format}
                venueName={event.venueName}
                category={event.categoryName}
                seatsLeft={event.seatsLeft}
                organizer={event.organizerName}
                key={event.id}
              />
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="empty-state search-empty-state">
            <p role="status">検索条件に一致するイベントがありません。</p>
            <button type="button" className="reset-filter-button" onClick={resetAppliedSearch}>
              検索条件をクリア
            </button>
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
