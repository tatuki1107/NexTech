import { EventDetailLoader } from "../../_components/EventDetailLoader";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EventDetailLoader id={id} />;
}
