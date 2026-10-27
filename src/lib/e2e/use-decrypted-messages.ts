import { useEffect, useState } from "react";

import type { Message } from "@/types/application/message/message";

import { decryptReceived } from "./conversation";
import { hasLocalKeys } from "./key-manager";

/**
 * Hook que decifra mensagens E2E em batch. Mensagens sem e2e passam direto.
 * Retorna as mensagens com o texto em claro (ou fallback se não conseguir decifrar).
 */
export function useDecryptedMessages(messages: Message[]): Message[] {
  const [decrypted, setDecrypted] = useState<Message[]>(() =>
    messages.map((msg) => (msg.e2e ? { ...msg, text: "🔒" } : msg)),
  );

  useEffect(() => {
    let cancelled = false;

    async function decrypt() {
      const hasE2e = messages.some((msg) => msg.e2e);
      if (!hasE2e) {
        setDecrypted(messages);
        return;
      }

      const hasKeys = await hasLocalKeys();
      if (!hasKeys) {
        setDecrypted(
          messages.map((msg) => (msg.e2e ? { ...msg, text: "🔒 Mensagem cifrada" } : msg)),
        );
        return;
      }

      const results = await Promise.all(
        messages.map(async (msg) => {
          if (!msg.e2e) return msg;
          const plaintext = await decryptReceived(msg);
          return { ...msg, text: plaintext };
        }),
      );

      if (!cancelled) setDecrypted(results);
    }

    decrypt();
    return () => {
      cancelled = true;
    };
  }, [messages]);

  return decrypted;
}
