export type Conversation = {
  id: string;
  kind: "DIRECT" | "GROUP" | "JOB" | "SERVICE";
  title: string | null;
  participantIds: string[];
  lastMessage: string | null;
  time: string | null;
  unread: number;
  /** Quando o outro participante abriu a conversa pela última vez (recibo de leitura). */
  otherLastReadAt?: string | null;
  /** A última mensagem é E2E (ciphertext em lastMessage). */
  lastMessageE2e?: boolean;
  /** IV da última mensagem E2E (necessário pra decifrar). */
  lastMessageIv?: string | null;
};
