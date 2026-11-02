"use client";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import { useState } from "react";
import { useParticipant } from "./ParticipantProvider";
import { errorMessage } from "../_lib/api";
export function BookmarkButton({
  eventId,
  title,
}: {
  eventId: string;
  title: string;
}) {
  const { user, savedIds, toggleSaved, loading } = useParticipant();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const saved = savedIds.includes(eventId);
  async function toggle() {
    if (!user) {
      window.location.assign(
        `/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`,
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      await toggleSaved(eventId);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <span>
      <button
        className={`bookmark-button ${saved ? "is-bookmarked" : ""}`}
        type="button"
        disabled={busy || loading}
        onClick={toggle}
        aria-pressed={saved}
        aria-label={`${title}を${saved ? "保存から外す" : "保存"}`}
      >
        {saved ? <BookmarkIcon /> : <BookmarkBorderOutlinedIcon />}
      </button>
      {error && <small role="alert">{error}</small>}
    </span>
  );
}
