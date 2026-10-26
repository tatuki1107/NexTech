import Link from "next/link";

type NextEvent = {
  title: string;
  schedule: string;
  applied: number;
  capacity: number;
  attendanceRate: number;
};

type NextEventCardProps = {
  event: NextEvent;
};

export default function NextEventCard({ event }: NextEventCardProps) {
  return (
    <div className="rounded-xl border border-ol-neutral-primary bg-white p-6">
      <h3 className="text-lg font-bold text-fg-neutral-primary">
        {event.title}
      </h3>
      <p className="mt-3 text-xs text-fg-neutral-secondary">{event.schedule}</p>
      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-12 text-sm font-bold">
          <p className="text-fg-brand-primary">
            申込 {event.applied} / {event.capacity}名
          </p>
          <p className="text-fg-accent-green">
            平均参加率 {event.attendanceRate}%
          </p>
        </div>
        <Link
          href="/organizer/event-management"
          className="rounded-lg bg-fg-brand-primary px-8 py-3 text-xs font-bold text-fg-inverse-primary"
        >
          イベント管理へ
        </Link>
      </div>
    </div>
  );
}