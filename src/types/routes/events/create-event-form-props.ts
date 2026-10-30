import type { CreateEventRequest } from "@/types/application/event/create-event-request";

export type CreateEventFormProps = {
  onSave: (data: CreateEventRequest) => void;
  isPending: boolean;
  /** Last create rejection: location codes show under the city field. */
  error?: unknown;
};
