import EventForm from "../_components/EventForm";
import { EMPTY_EVENT_FORM } from "../_lib/event-form";

export default function NewEventPage() {
  return <EventForm mode="new" initialValues={EMPTY_EVENT_FORM} />;
}