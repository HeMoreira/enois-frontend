export type TimeSlot = {
  id: string;
  /** Horários são **anuláveis**: o backend devolve `null` quando o slot não tem data (`startsAt() != null ? ... : null`). */
  startsAt: string | null;
  endsAt: string | null;
  available: boolean;
};
