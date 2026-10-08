import { EventSearch } from "./components/event-search";
import { UserShell } from "./components/user-shell";
import { Suspense } from "react";

export default function Home() {
  return (
    <UserShell active="search">
      <section className="page-heading top-page-heading"><h1>参加したいイベントを<br />見つけよう</h1></section>
      <Suspense fallback={<p className="empty-state">イベントを読み込んでいます…</p>}>
        <EventSearch />
      </Suspense>
    </UserShell>
  );
}
