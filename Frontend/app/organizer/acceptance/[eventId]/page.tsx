import RegistrationsScreen from "../../request-management/_components/RegistrationsScreen";
export default async function Page({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return <RegistrationsScreen eventId={eventId} acceptance />;
}
