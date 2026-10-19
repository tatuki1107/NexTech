import Link from "next/link";
import { UserShell } from "../../components/user-shell";

export default function EventNotFound() {
  return (
    <UserShell showBack>
      <section className="empty-state">
        <h1>イベントが見つかりません</h1>
        <p>イベントが削除されたか、公開されていない可能性があります。</p>
        <Link href="/" className="detail-button">イベント一覧へ</Link>
      </section>
    </UserShell>
  );
}
