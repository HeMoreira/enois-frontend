import type { SessionStatus } from "./session-status";

/** Sessão vista por quem agendou (mentorado): quem atende, quando e por quanto. */
export type MySession = {
  id: string;
  mentorId: string;
  mentorUsername: string | null;
  mentorName: string | null;
  mentorAvatar: string | null;
  startsAt: string | null;
  endsAt: string | null;
  message: string | null;
  status: SessionStatus;
  /** Preço pago em milésimos de faísca (`null` quando a sessão é gratuita). */
  priceSparks: number | null;
  /** Sala externa da sessão, exposta para quem agendou. */
  meetingUrl: string | null;
  createdAt: string;
};
