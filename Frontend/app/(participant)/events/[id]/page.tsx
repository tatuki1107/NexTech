import { notFound } from "next/navigation";
import { EventDetail } from "../../_components/EventDetail";
import { EventDetailError } from "../../_components/EventDetailError";
import { getEventDetail } from "../../_lib/event-detail";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getEventDetail(id);
  if (result.status === "not-found") notFound();
  if (result.status === "unavailable") return <EventDetailError eventId={id} />;
  return <EventDetail event={result.event} />;
}
