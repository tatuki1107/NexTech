import EventDetailScreen from "../_components/EventDetailScreen";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EventDetailScreen eventId={id} />;
}
