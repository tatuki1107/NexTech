"use client";
import { useState } from "react";
import { useOrganizer } from "../../_components/OrganizerProvider";
import { ApiState, CONTROL } from "../../_components/ApiState";
import { useResource } from "../../_lib/use-resource";
import { organizerPath, eventView, type ManagedEvent } from "../../_lib/api";
import EventRequestTable from "./EventRequestTable";
import SummaryCard from "./SummaryCard";

const STATUS_OPTIONS = {
  published: "公開中",
  draft: "下書き",
  completed: "開催済み",
  cancelled: "中止",
};
export default function RequestsScreen() {
  const { organization } = useOrganizer();
  const { data, error, reload } = useResource<ManagedEvent[]>(
    organizerPath(organization.id) + "/events",
    true,
  );
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("updated");
  const query = keyword.trim().normalize("NFKC").toLocaleLowerCase("ja");
  const events = (data ?? [])
    .filter((event) =>
      (!status || event.status === status) &&
      event.title.normalize("NFKC").toLocaleLowerCase("ja").includes(query),
    )
    .sort((first, second) => {
      if (sort === "title") return first.title.localeCompare(second.title, "ja");
      return Date.parse(second.updatedAt) - Date.parse(first.updatedAt);
    });
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold md:text-[26px]">申込管理</h1>
      {!data ? (
        <ApiState error={error} retry={reload} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 md:gap-6">
            <SummaryCard label="イベント" value={data.length} />
            <SummaryCard
              label="参加確定枠"
              value={data.reduce((sum, e) => sum + e.confirmedCount, 0)}
            />
            <SummaryCard
              label="キャンセル待ち"
              value={data.reduce((sum, e) => sum + e.waitlistCount, 0)}
            />
          </div>
          <section aria-labelledby="organizer-requests-heading" className="space-y-4">
            <h2 id="organizer-requests-heading" className="text-xl font-bold">イベント別申込状況</h2>
            <div className="flex flex-wrap gap-3">
              <input
                type="search"
                aria-label="イベント名で検索"
                placeholder="イベント名で検索"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className={`${CONTROL} min-w-0 flex-[1_1_14rem]`}
              />
              <select
                aria-label="並び替え"
                className={CONTROL}
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="updated">更新日が新しい順</option>
                <option value="title">イベント名順</option>
              </select>
              <select
                aria-label="公開状態で絞り込み"
                className={CONTROL}
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="">すべての状態</option>
                {Object.entries(STATUS_OPTIONS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <p role="status" className="text-sm text-fg-neutral-secondary">{events.length}件のイベント</p>
            <EventRequestTable events={events.map((event) => ({ ...eventView(event), capacity: event.capacity }))} />
          </section>
        </>
      )}
    </div>
  );
}
