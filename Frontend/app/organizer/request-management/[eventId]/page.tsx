import RegistrationsScreen from "../_components/RegistrationsScreen";
export default async function Page({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return <RegistrationsScreen eventId={eventId} />;
}
