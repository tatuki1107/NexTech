import type { OrganizerEvent } from "../../event-management/_lib/event";

export type AcceptanceEvent = OrganizerEvent & {
  checkedIn: number;
};

export type Participant = {
  id: string;
  name: string;
  nameKana: string;
  requestNumber: string;
  isCheckedIn: boolean;
};