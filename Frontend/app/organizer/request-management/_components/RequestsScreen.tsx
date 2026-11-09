"use client";
import { useOrganizer } from "../../_components/OrganizerProvider";
import { ApiState, PageTitle } from "../../_components/ApiState";
import { useResource } from "../../_lib/use-resource";
import { organizerPath, eventView, type ManagedEvent } from "../../_lib/api";
import EventRequestTable from "./EventRequestTable";
import SummaryCard from "./SummaryCard";
export default function RequestsScreen() {
  const { organization } = useOrganizer();
  const { data, error, reload } = useResource<ManagedEvent[]>(
    organizerPath(organization.id) + "/events",
    true,
  );
  return (
    <div className="space-y-8">
      <PageTitle title="申込管理" />
      {!data ? (
        <ApiState error={error} retry={reload} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-6">
            <SummaryCard label="イベント" value={data.length} />
            <SummaryCard
              label="参加確定枠"
              value={data.reduce((sum, e) => sum + e.confirmedCount, 0)}
            />
            <SummaryCard
              label="キャンセル待ち"
              value={data.reduce((sum, e) => sum + e.waitlistCount, 0)}
            />
          </div>
          <EventRequestTable events={data.map(eventView)} />
        </>
      )}
    </div>
  );
}
