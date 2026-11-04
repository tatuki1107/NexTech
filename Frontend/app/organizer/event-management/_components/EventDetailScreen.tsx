"use client";
import Link from "next/link";
import { useOrganizer } from "../../_components/OrganizerProvider";
import { ApiState, PageTitle, CONTROL } from "../../_components/ApiState";
import { useResource } from "../../_lib/use-resource";
import {
  managedEventPath,
  eventView,
  formatDate,
  type ManagedEvent,
} from "../../_lib/api";
import StatusBadge from "./StatusBadge";
import EventManagementActions from "./EventManagementActions";
import DetailCard from "./detail/DetailCard";
export default function EventDetailScreen({ eventId }: { eventId: string }) {
  const { organization } = useOrganizer();
  const {
    data: event,
    error,
    reload,
  } = useResource<ManagedEvent>(managedEventPath(organization.id, eventId));
  if (!event) return <ApiState error={error} retry={reload} />;
  return (
    <div className="space-y-8">
      <Link href="/organizer/event-management" className="underline">
        イベント一覧へ
      </Link>
      <PageTitle title={event.title}>
        <StatusBadge status={eventView(event).status} />
      </PageTitle>
      <EventManagementActions event={eventView(event)} onChanged={reload} />
      <DetailCard title="基本情報">
        <dl className="space-y-3">
          {[
            [
              "開催日時",
              formatDate(event.startAt) + " 〜 " + formatDate(event.endAt),
            ],
            [
              "開催形式",
              event.format
                ? {
                    online: "オンライン",
                    offline: "会場開催",
                    hybrid: "ハイブリッド",
                  }[event.format]
                : "未設定",
            ],
            ["会場", event.venueName || "未設定"],
            ["住所", event.address || "未設定"],
            ["配信URL", event.onlineUrl ?? "未設定"],
            ["カテゴリ", event.category?.name ?? "未設定"],
            ["タグ", event.tags.map((tag) => tag.name).join(" / ") || "なし"],
            ["定員", event.capacity ?? "未設定"],
            ["申込受付開始", formatDate(event.applicationStartAt)],
            ["申込期限", formatDate(event.applicationDeadline)],
            ["キャンセル待ち", event.waitlistEnabled ? "有効" : "無効"],
            ["最終更新", formatDate(event.updatedAt)],
          ].map(([label, value]) => (
            <div key={label} className="grid grid-cols-[10rem_1fr] gap-4">
              <dt>{label}</dt>
              <dd className="break-all">{value}</dd>
            </div>
          ))}
        </dl>
      </DetailCard>
      <DetailCard title="イベント内容">
        <p className="whitespace-pre-wrap">{event.description || "未設定"}</p>
      </DetailCard>
      <DetailCard title="参加条件">
        <p className="whitespace-pre-wrap">
          {event.participationConditions || "なし"}
        </p>
      </DetailCard>
      <div className="flex gap-4">
        <Link
          className={CONTROL}
          href={`/organizer/request-management/${event.id}`}
        >
          申込者一覧
        </Link>
        <Link className={CONTROL} href={`/organizer/acceptance/${event.id}`}>
          受付画面
        </Link>
      </div>
    </div>
  );
}
