"use client";
import Link from "next/link";
import { useOrganizer } from "../OrganizerProvider";
import { ApiState, PageTitle, BUTTON } from "../ApiState";
import { useResource } from "../../_lib/use-resource";
import {
  organizerPath,
  tokyoDate,
  formatDate,
  type ManagedEvent,
} from "../../_lib/api";
import StatCard from "./StatCard";
export default function DashboardScreen() {
  const { organization } = useOrganizer();
  const {
    data: events,
    error,
    reload,
  } = useResource<ManagedEvent[]>(
    organizerPath(organization.id) + "/events",
    true,
  );
  const next = events
    ?.filter(
      (event) =>
        event.status === "published" &&
        event.startAt &&
        new Date(event.startAt) > new Date(),
    )
    .sort((a, b) => a.startAt!.localeCompare(b.startAt!))[0];
  return (
    <div className="space-y-10">
      <PageTitle title="ダッシュボード">
        <Link href="/organizer/event-management/new" className={BUTTON}>
          新しいイベントを作成
        </Link>
      </PageTitle>
      <p>{organization.name}</p>
      {!events ? (
        <ApiState error={error} retry={reload} />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-6 xl:grid-cols-4">
            {[
              [
                "公開中イベント",
                events.filter((e) => e.status === "published").length,
              ],
              ["下書き", events.filter((e) => e.status === "draft").length],
              [
                "参加確定枠（全期間）",
                events.reduce((sum, e) => sum + e.confirmedCount, 0),
              ],
              [
                "今日開催",
                events.filter(
                  (e) =>
                    e.status === "published" &&
                    e.startAt &&
                    tokyoDate(new Date(e.startAt)) === tokyoDate(),
                ).length,
              ],
            ].map(([label, value]) => (
              <StatCard
                key={label}
                label={String(label)}
                value={String(value)}
                note="選択中の主催者"
                valueClassName="text-fg-brand-primary"
              />
            ))}
          </section>
          <div className="flex flex-wrap gap-5">
            <Link href="/organizer/request-management" className={BUTTON}>
              申込状況を確認
            </Link>
            <Link href="/organizer/analytics-report" className={BUTTON}>
              分析レポートを見る
            </Link>
          </div>
          <section className="space-y-4 rounded-xl border border-ol-neutral-primary bg-white p-6">
            <h2 className="text-xl font-bold">次の開催</h2>
            {next ? (
              <>
                <p>{next.title}</p>
                <p>{formatDate(next.startAt)}</p>
                <p>
                  申込 {next.confirmedCount} / {next.capacity}名
                </p>
                <Link
                  href={`/organizer/event-management/${next.id}`}
                  className="underline"
                >
                  イベント詳細へ
                </Link>
              </>
            ) : (
              <p>次回の公開イベントはありません。</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
