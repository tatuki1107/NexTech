import Link from "next/link";

import StatusBadge from "../../event-management/_components/StatusBadge";
import type { EventRequestSummary } from "../_lib/request";

type EventRequestTableProps = {
  events: EventRequestSummary[];
};

const CELL = "px-6 py-5";

export default function EventRequestTable({ events }: EventRequestTableProps) {
  if (events.length === 0) {
    return (
      <p className="rounded-xl border border-ol-neutral-primary bg-white p-8 text-center text-sm text-fg-neutral-secondary">
        対象のイベントがありません。
      </p>
    );
  }

  return (
    <div className="max-h-[calc(100vh-32rem)] overflow-y-auto rounded-xl border border-ol-neutral-primary bg-white">
      <table className="w-full">
        <thead className="sticky top-0 z-10 bg-bg-neutral-primary">
          <tr className="text-left text-sm text-fg-neutral-secondary">
            <th scope="col" className={CELL}>
              イベント
            </th>
            <th scope="col" className={`${CELL} w-25 text-center`}>
              申込
            </th>
            <th scope="col" className={`${CELL} w-25 text-center`}>
              待機
            </th>
            <th scope="col" className={`${CELL} w-35`}>
              状態
            </th>
            <th scope="col" className={`${CELL} w-45`}>
              <span className="sr-only">操作</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr
              key={event.id}
              className="border-t border-ol-neutral-primary align-middle"
            >
              <td className={CELL}>
                <p className="text-base font-bold text-fg-neutral-primary">
                  {event.title}
                </p>
                <p className="mt-1 text-xs text-fg-neutral-secondary">
                  {event.schedule}
                </p>
              </td>
              <td
                className={`${CELL} text-center text-base font-bold text-fg-neutral-primary`}
              >
                {event.applied}
              </td>
              <td
                className={`${CELL} text-center text-base font-bold text-fg-neutral-primary`}
              >
                {event.waitlisted}
              </td>
              <td className={CELL}>
                <StatusBadge status={event.status} />
              </td>
              <td className={CELL}>
                <Link
                  href={`/organizer/request-management/${event.id}`}
                  className="flex h-12 items-center justify-center rounded-xl border-2 border-fg-brand-primary text-base font-bold text-fg-brand-primary"
                >
                  申込を見る
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
