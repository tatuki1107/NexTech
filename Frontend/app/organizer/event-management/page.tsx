import Link from "next/link";

import { MOCK_EVENTS } from "../_mocks/events";
import EventCard from "./_components/EventCard";
import EventManagementActions from "./_components/EventManagementActions";
import { calculateRate } from "./_lib/event";

const events = MOCK_EVENTS;

export default function EventManagementPage() {
  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-fg-neutral-primary">
          イベント管理
        </h1>
        <Link
          href="/organizer/event-management/new"
          className="flex h-14 items-center gap-2 rounded-xl bg-fg-brand-primary px-6 text-fg-inverse-primary"
        >
          <span aria-hidden="true">＋</span>
          新規イベント作成
        </Link>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-fg-neutral-primary">
            すべてのイベント
          </h2>
          {/* 並び替えは仮(選択肢は1つだけ)。実装は別PR */}
          <div className="relative">
            <select
              aria-label="並び替え"
              className="h-14 w-40 appearance-none rounded-xl border border-ol-neutral-primary bg-white pr-6 text-center text-fg-neutral-primary"
            >
              <option>開催日順</option>
            </select>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-neutral-primary"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>

        {events.length === 0 ? (
          <p className="rounded-xl border border-ol-neutral-primary bg-white p-8 text-center text-sm text-fg-neutral-secondary">
            イベントはまだありません。「新規イベント作成」から追加できます。
          </p>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                summary={`申込 ${event.applied} / 定員 ${event.capacity}　待機 ${event.waitlisted}`}
                rate={calculateRate(event.applied, event.capacity)}
                rateLabel="申込率"
                actions={<EventManagementActions event={event} />}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
