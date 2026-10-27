import type { ReportReason } from "./report-reason";
import type { ReportTargetType } from "./report-target-type";

export type ReportInput = {
  targetId: string;
  targetType: ReportTargetType;
  reason: ReportReason;
  description?: string;
  /** Chave da conversa E2E (plain, em base64). O moderador usa pra decifrar as mensagens denunciadas. */
  e2eConversationKey?: string;
};
