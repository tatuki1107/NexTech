import Link from "next/link";
import { ParticipantShell } from "./ParticipantShell";

export function EventDetailError({ eventId }: { eventId: string }) {
  return (
    <ParticipantShell showBack>
      <section role="alert" className="empty-state">
        <h1>イベント情報を取得できませんでした</h1>
        <p>時間をおいて、再度お試しください。</p>
        <Link
          href={`/events/${encodeURIComponent(eventId)}`}
          className="detail-button"
        >
          再読み込み
        </Link>
      </section>
    </ParticipantShell>
  );
}
