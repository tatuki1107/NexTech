import {
  MOCK_EDIT_FORM_VALUES,
  MOCK_EDIT_LAST_UPDATED,
} from "../../../_mocks/events";
import EventForm from "../../_components/EventForm";

export default function EditEventPage() {
  return (
    <EventForm
      mode="edit"
      initialValues={MOCK_EDIT_FORM_VALUES}
      lastUpdated={MOCK_EDIT_LAST_UPDATED}
    />
  );
}
