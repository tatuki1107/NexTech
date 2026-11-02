import Link from "next/link";

import { MOCK_ACCEPTANCE_EVENT } from "../../_mocks/events";
import { MOCK_ACCEPTANCE_PARTICIPANTS } from "../../_mocks/participants";
import AcceptancePanel from "../_components/AcceptancePanel";

const event = MOCK_ACCEPTANCE_EVENT;

export default function AcceptanceDetailPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link
          href="/organizer/acceptance"
          className="flex w-fit items-center gap-2 text-base font-bold text-fg-neutral-primary"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
          当日受付に戻る
        </Link>
        <div className="flex items-center justify-between gap-6">
          <h1 className="text-3xl font-bold text-fg-neutral-primary">
            {event.title}
          </h1>
          <Link
            href={`/organizer/event-management/${event.id}`}
            className="flex h-14 shrink-0 items-center rounded-xl border border-ol-neutral-primary bg-white px-6 text-sm font-bold text-fg-neutral-primary"
          >
            イベント詳細へ
          </Link>
        </div>
      </div>

      <AcceptancePanel initialParticipants={MOCK_ACCEPTANCE_PARTICIPANTS} />
    </div>
  );
}
