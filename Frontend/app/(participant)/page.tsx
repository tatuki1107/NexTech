import { EventSearch } from "@/app/(participant)/_components/EventSearch";
import { ParticipantShell } from "@/app/(participant)/_components/ParticipantShell";
import { Suspense } from "react";

export default function Home() {
  return (
    <ParticipantShell active="search">
      <section className="page-heading top-page-heading">
        <h1>
          参加したいイベントを
          <br />
          見つけよう
        </h1>
      </section>
      <Suspense
        fallback={<p className="empty-state">イベントを読み込んでいます…</p>}
      >
        <EventSearch />
      </Suspense>
    </ParticipantShell>
  );
}
