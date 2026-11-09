"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useOrganizer } from "../../_components/OrganizerProvider";
import { ApiState, PageTitle, CONTROL } from "../../_components/ApiState";
import { useResource } from "../../_lib/use-resource";
import {
  managedEventPath,
  apiRequest,
  errorMessage,
  formatDate,
  downloadCsv,
  registrationLabels,
  type ManagedEvent,
  type Registration,
} from "../../_lib/api";
import SummaryCard from "./SummaryCard";
import ConfirmDialog from "../../event-management/_components/ConfirmDialog";
export default function RegistrationsScreen({
  eventId,
  acceptance = false,
}: {
  eventId: string;
  acceptance?: boolean;
}) {
  const { organization } = useOrganizer();
  const event = useResource<ManagedEvent>(
    managedEventPath(organization.id, eventId),
  );
  const registrations = useResource<Registration[]>(
    `/events/${eventId}/registrations`,
    true,
  );
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("applied");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [undo, setUndo] = useState<string | null>(null);
  async function checkIn(id: string, cancel = false) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await apiRequest(`/events/${eventId}/registrations/${id}/check-in`, {
        method: cancel ? "DELETE" : "POST",
        ...(cancel ? {} : { body: "{}" }),
      });
      setUndo(null);
      registrations.reload();
    } catch (e) {
      setError(errorMessage(e));
      setUndo(null);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (!event.data || !registrations.data)
    return (
      <ApiState
        error={event.error || registrations.error}
        retry={() => {
          event.reload();
          registrations.reload();
        }}
      />
    );
  const all = registrations.data;
  const eventStatus = event.data.status;
  const rows = all
    .filter(
      (row) =>
        (!status || row.status === status) &&
        [row.user.displayName, row.user.fullName, row.user.email, row.id].some(
          (value) =>
            value?.toLocaleLowerCase().includes(keyword.toLocaleLowerCase()),
        ),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.user.displayName.localeCompare(b.user.displayName, "ja")
        : a.appliedAt.localeCompare(b.appliedAt),
    );
  const confirmed = all.filter((row) =>
    ["pending", "confirmed", "checked_in", "no_show"].includes(row.status),
  ).length;
  const checked = all.filter((row) => row.status === "checked_in").length;
  return (
    <div className="space-y-8">
      <Link
        className="underline"
        href={
          acceptance ? "/organizer/acceptance" : "/organizer/request-management"
        }
      >
        一覧に戻る
      </Link>
      <PageTitle title={event.data.title}>
        <Link
          className={CONTROL}
          href={`/organizer/event-management/${eventId}`}
        >
          イベント詳細へ
        </Link>
      </PageTitle>
      <h2 className="text-xl font-bold">
        {acceptance ? "当日受付" : "申込者一覧"}
      </h2>
      <div className="grid grid-cols-3 gap-6">
        <SummaryCard label="参加確定枠" value={confirmed} />
        <SummaryCard
          label={acceptance ? "受付済み" : "待機"}
          value={
            acceptance
              ? checked
              : all.filter((row) => row.status === "waitlisted").length
          }
        />
        <SummaryCard
          label={acceptance ? "未受付（参加確定のみ）" : "キャンセル"}
          value={
            acceptance
              ? all.filter((row) => row.status === "confirmed").length
              : all.filter((row) => row.status === "cancelled").length
          }
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <input
          type="search"
          aria-label="氏名・メール・申込番号で検索"
          placeholder="氏名・メール・申込番号で検索"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className={CONTROL}
        />
        <select
          aria-label="状態で絞り込み"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={CONTROL}
        >
          <option value="">すべての状態</option>
          {Object.entries(registrationLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="並び替え"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className={CONTROL}
        >
          <option value="applied">申込日時順</option>
          <option value="name">表示名順</option>
        </select>
        <button
          type="button"
          className={CONTROL}
          onClick={() =>
            downloadCsv("registrations.csv", [
              ["申込番号", "表示名", "メール", "申込日時", "状態", "待機順位"],
              ...rows.map((row) => [
                row.id,
                row.user.displayName,
                row.user.email,
                formatDate(row.appliedAt),
                registrationLabels[row.status],
                row.waitlistPosition?.toString() ?? "",
              ]),
            ])
          }
        >
          CSV出力
        </button>
        <button
          type="button"
          className={CONTROL}
          onClick={() => registrations.reload()}
        >
          再取得
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="overflow-auto rounded-xl border border-ol-neutral-primary bg-white">
        <table className="w-full text-left">
          <thead>
            <tr>
              {[
                "参加者",
                "申込番号",
                "申込日時",
                "状態",
                acceptance ? "受付" : "詳細",
              ].map((label) => (
                <th key={label} className="p-4">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-ol-neutral-primary">
                <td className="p-4">
                  {row.user.displayName}
                  <p className="text-xs">{row.user.email}</p>
                </td>
                <td className="p-4 break-all">{row.id}</td>
                <td className="p-4">{formatDate(row.appliedAt)}</td>
                <td className="p-4">
                  {registrationLabels[row.status]}
                  {row.status === "waitlisted" &&
                    `（${row.waitlistPosition}番）`}
                </td>
                <td className="p-4">
                  {acceptance ? (
                    row.status === "confirmed" &&
                    eventStatus === "published" ? (
                      <button
                        className={CONTROL}
                        type="button"
                        disabled={busy}
                        onClick={() => void checkIn(row.id)}
                      >
                        受付する：{row.user.displayName}
                      </button>
                    ) : row.status === "checked_in" &&
                      eventStatus === "published" ? (
                      <button
                        className={CONTROL}
                        type="button"
                        disabled={busy}
                        onClick={() => setUndo(row.id)}
                      >
                        受付を取り消す：{row.user.displayName}
                      </button>
                    ) : (
                      "—"
                    )
                  ) : (
                    <details>
                      <summary className="cursor-pointer">詳細</summary>
                      <p>氏名：{row.user.fullName ?? "未登録"}</p>
                      <p>受付日時：{formatDate(row.checkedInAt)}</p>
                    </details>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="p-6">対象の申込はありません。</p>}
      </div>
      <ConfirmDialog
        isOpen={undo !== null}
        title="受付を取り消しますか？"
        description="参加確定の状態に戻します。"
        confirmLabel={busy ? "処理中…" : "取り消す"}
        cancelLabel="戻る"
        onConfirm={() => {
          if (undo) void checkIn(undo, true);
        }}
        onCancel={() => {
          if (!busy) setUndo(null);
        }}
      />
    </div>
  );
}
