import Link from "next/link";

import EventCard from "../event-management/_components/EventCard";
import { CARD_BUTTON } from "../event-management/_lib/card-button";
import { calculateRate } from "../event-management/_lib/event";
import type { AcceptanceEvent } from "./_lib/acceptance";

// 仮データ。APIができたら、本日開催のイベントを取得する形に置き換える
const todayEvents: AcceptanceEvent[] = [
  {
    id: "1",
    title: "React UI設計ワークショップ",
    status: "published",
    schedule: "6/14(土) 13:00 - 16:00",
    venue: "名古屋 / オンライン",
    applied: 32,
    capacity: 40,
    waitlisted: 0,
    checkedIn: 10,
  },
  {
    id: "2",
    title: "LLMアプリ開発入門",
    status: "published",
    schedule: "6/14(土) 18:30 - 20:00",
    venue: "オンライン",
    applied: 40,
    capacity: 40,
    waitlisted: 12,
    checkedIn: 0,
  },
];

export default function AcceptancePage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-fg-neutral-primary">当日受付</h1>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-fg-neutral-primary">
            本日開催のイベント
          </h2>
          <p className="text-sm text-fg-neutral-primary">
            {todayEvents.length}件
          </p>
        </div>

        {todayEvents.length === 0 ? (
          <p className="rounded-xl border border-ol-neutral-primary bg-white p-8 text-center text-sm text-fg-neutral-secondary">
            本日開催のイベントはありません。
          </p>
        ) : (
          <div className="space-y-4">
            {todayEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                summary={`受付 ${event.checkedIn} / 申込 ${event.applied}　未受付 ${event.applied - event.checkedIn}`}
                rate={calculateRate(event.checkedIn, event.applied)}
                rateLabel="受付率"
                actions={
                  <>
                    <Link
                      href={`/organizer/acceptance/${event.id}`}
                      className={CARD_BUTTON.brand}
                    >
                      受付
                    </Link>
                    {/* 受付終了の動作は確認ダイアログと一緒に別PRで実装 */}
                    <button type="button" className={CARD_BUTTON.danger}>
                      受付終了
                    </button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
