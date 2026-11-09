"use client";
import { useOrganizer } from "../../_components/OrganizerProvider";
import { ApiState } from "../../_components/ApiState";
import { useResource } from "../../_lib/use-resource";
import { managedEventPath, type ManagedEvent } from "../../_lib/api";
import { EMPTY_EVENT_FORM, eventFormValues } from "../_lib/event-form";
import EventForm from "./EventForm";
function ExistingEditor({ eventId }: { eventId: string }) {
  const { organization } = useOrganizer();
  const { data, error, reload } = useResource<ManagedEvent>(
    managedEventPath(organization.id, eventId),
  );
  if (!data) return <ApiState error={error} retry={reload} />;
  if (data.status === "cancelled")
    return <p>中止済みイベントは編集できません。</p>;
  return (
    <EventForm
      mode="edit"
      initialValues={eventFormValues(data)}
      initialEvent={data}
    />
  );
}
export default function EventEditor({ eventId }: { eventId?: string }) {
  return eventId ? (
    <ExistingEditor eventId={eventId} />
  ) : (
    <EventForm mode="new" initialValues={EMPTY_EVENT_FORM} />
  );
}
