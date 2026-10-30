import type { PageResponse } from "@/types/application/api/page-response";
import type { StatusResponse } from "@/types/application/api/status-response";
import type { CreateEventRequest } from "@/types/application/event/create-event-request";
import type { Event } from "@/types/application/event/event";
import type { EventRecurrence } from "@/types/application/event/event-recurrence";

import { api, buildQuery } from "../api-client";

export const eventsApi = {
  /** `recurring: true` lists only series ("rituais"). */
  list: (format?: string, cursor?: string | null, limit = 20, recurring?: boolean) =>
    api.get<PageResponse<Event>>(
      `/events${buildQuery({ format, cursor, limit, recurring: recurring || undefined })}`,
    ),

  get: (eventId: string) => api.get<Event>(`/events/${eventId}`),

  create: (data: CreateEventRequest) => api.post<Event>("/events", data),

  attend: (eventId: string) => api.post<StatusResponse>(`/events/${eventId}/attendees`),

  /** Creator only: changes the cadence of the whole series; `NONE` stops it. */
  setRecurrence: (eventId: string, recurrence: EventRecurrence) =>
    api.patch<Event>(`/events/${eventId}/recurrence`, { recurrence }),

  cancelAttendance: (eventId: string) => api.delete<StatusResponse>(`/events/${eventId}/attendees`),
};
