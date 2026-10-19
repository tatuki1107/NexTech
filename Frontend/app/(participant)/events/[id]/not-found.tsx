import Link from "next/link";
import { ParticipantShell } from "@/app/(participant)/_components/ParticipantShell";

export default function EventNotFound() {
  return (
    <ParticipantShell showBack>
      <section className="empty-state">
        <h1>イベントが見つかりません</h1>
        <p>イベントが削除されたか、公開されていない可能性があります。</p>
        <Link href="/" className="detail-button">
          イベント一覧へ
        </Link>
      </section>
    </ParticipantShell>
  );
}
