"use client";
import Link from "next/link";
import { useState } from "react";
import { apiRequest, errorMessage } from "../_lib/api";
import { useApiData } from "../_lib/use-api-data";
import type { NamedItem, ParticipantEvent } from "../_lib/types";
import { ApiState } from "./ApiState";

export function InterestManager() {
  const categories = useApiData<{ data: NamedItem[] }>("/categories");
  const followedCategories = useApiData<NamedItem[]>(
    "/me/favorite-categories",
    true,
  );
  const followedOrganizers = useApiData<NamedItem[]>(
    "/me/favorite-organizers",
    true,
  );
  const events = useApiData<ParticipantEvent[]>("/events", true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const organizers = [
    ...new Map(
      [
        ...(followedOrganizers.data ?? []),
        ...(events.data ?? []).map((event) => event.organizer),
      ].map((item) => [item.id, item]),
    ).values(),
  ];
  const resources = [
    categories,
    followedCategories,
    followedOrganizers,
    events,
  ];
  async function toggle(
    type: "categories" | "organizers",
    item: NamedItem,
    followed: boolean,
  ) {
    setBusy(true);
    setError("");
    try {
      await apiRequest(`/me/favorite-${type}/${item.id}`, {
        method: followed ? "DELETE" : "PUT",
      });
      if (type === "categories") followedCategories.reload();
      else followedOrganizers.reload();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  const loading = resources.some((resource) => resource.loading);
  const resourceError = resources.find((resource) => resource.error)?.error;
  return (
    <section className="interest-page">
      <div className="page-heading compact-heading">
        <h1>興味・フォロー</h1>
        <p>カテゴリとイベント主催者をフォローできます</p>
      </div>
      <ApiState
        loading={loading}
        error={resourceError}
        retry={() => resources.forEach((resource) => resource.reload())}
      />
      {error && <p role="alert">{error}</p>}
      {!loading && !resourceError && (
        <>
          <h2>カテゴリー</h2>
          <div className="chip-grid">
            {categories.data?.data.map((item) => {
              const followed =
                followedCategories.data?.some((row) => row.id === item.id) ??
                false;
              return (
                <button
                  type="button"
                  className={`filter-chip ${followed ? "is-selected" : ""}`}
                  key={item.id}
                  disabled={busy}
                  aria-pressed={followed}
                  onClick={() => void toggle("categories", item, followed)}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
          <h2>主催者</h2>
          <div className="follow-list">
            {organizers.map((item) => {
              const followed =
                followedOrganizers.data?.some((row) => row.id === item.id) ??
                false;
              return (
                <div key={item.id}>
                  <p>{item.name}</p>
                  <button
                    className="outline-button"
                    type="button"
                    disabled={busy}
                    aria-pressed={followed}
                    onClick={() => void toggle("organizers", item, followed)}
                  >
                    {followed ? "フォロー中" : "フォローする"}
                  </button>
                </div>
              );
            })}
          </div>
          {organizers.length === 0 && <p>主催者はまだありません。</p>}
          <Link className="find-organizer-button" href="/search">
            イベントから主催者を探す
          </Link>
        </>
      )}
    </section>
  );
}
