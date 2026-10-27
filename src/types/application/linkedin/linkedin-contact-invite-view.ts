import type { LinkedinInviteStatus } from "./linkedin-invite-status";

/** Um contato importado, com o estado do convite no Énóis. */
export type LinkedinContactInviteView = {
  name: string;
  status: LinkedinInviteStatus;
  matchedUsername: string | null;
};
