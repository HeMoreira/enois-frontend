import type { StatusResponse } from "../api/status-response";

export type BookSessionResponse = StatusResponse & {
  /**
   * O id da sessão agendada. O backend devolve no campo `id` (`new StatusResponse(session.id(),
   * "SCHEDULED")`), não em `sessionId` — o nome antigo era um campo que a API nunca mandou.
   */
  id: string;
};
