import type { SupportMessageDirection } from "./support-message-direction";

/** Resposta do painel ou comentário trazido da issue do GitHub. */
export type SupportMessage = {
  id: string;
  direction: SupportMessageDirection;
  authorName: string | null;
  authorGithubLogin: string | null;
  body: string;
  createdAt: string;
};
