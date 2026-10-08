"use client";

import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import { useSyncExternalStore } from "react";

const BOOKMARK_STORAGE_KEY = "nextech-bookmarked-event-ids";
export const BOOKMARK_EVENT_NAME = "nextech-bookmarks-changed";

export function readBookmarkedEventIds(): string[] {
  const storedValue = window.localStorage.getItem(BOOKMARK_STORAGE_KEY);
  if (!storedValue) return [];

  try {
    const parsedValue: unknown = JSON.parse(storedValue);
    return Array.isArray(parsedValue) && parsedValue.every((value) => typeof value === "string") ? parsedValue : [];
  } catch {
    return [];
  }
}

export function BookmarkButton({ eventId, title }: { eventId: string; title: string }) {
  const isBookmarked = useSyncExternalStore(
    (callback) => {
      window.addEventListener(BOOKMARK_EVENT_NAME, callback);
      return () => window.removeEventListener(BOOKMARK_EVENT_NAME, callback);
    },
    () => readBookmarkedEventIds().includes(eventId),
    () => false,
  );

  const handleBookmarkToggle = () => {
    const bookmarkIds = readBookmarkedEventIds();
    const nextBookmarkIds = bookmarkIds.includes(eventId)
      ? bookmarkIds.filter((id) => id !== eventId)
      : [...bookmarkIds, eventId];

    window.localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(nextBookmarkIds));
    window.dispatchEvent(new Event(BOOKMARK_EVENT_NAME));
  };

  return <button className={`bookmark-button ${isBookmarked ? "is-bookmarked" : ""}`} type="button" onClick={handleBookmarkToggle} aria-pressed={isBookmarked} aria-label={`${title}を${isBookmarked ? "保存から外す" : "保存"}`}>{isBookmarked ? <BookmarkIcon /> : <BookmarkBorderOutlinedIcon />}</button>;
}
