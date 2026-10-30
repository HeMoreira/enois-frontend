/**
 * E2E por conversa: cifra antes de enviar, decifra ao receber.
 *
 * Fluxo de envio:
 * 1. Busca chave simétrica da conversa (cache local ou backend)
 * 2. Se não existe, gera e distribui pra todos os participantes
 * 3. Cifra a mensagem com AES-256-GCM
 * 4. Envia ciphertext + iv pro backend
 *
 * Fluxo de recebimento:
 * 1. Mensagem chega com e2e=true
 * 2. Busca chave simétrica da conversa
 * 3. Decifra com AES-256-GCM
 */
import type { Message } from "@/types/application/message/message";

import { e2eApi } from "@/lib/api/e2e";

import {
  decryptMessage,
  decryptWithPrivateKey,
  encryptForRecipient,
  encryptMessage,
  exportSymmetricKey,
  generateConversationKey,
  importPrivateKey,
  importPublicKey,
  importSymmetricKey,
} from "./crypto";
import { getLocalPrivateKey } from "./key-manager";

/** Cache em memória das chaves simétricas já importadas (por conversa). */
const conversationKeyCache = new Map<string, CryptoKey>();
/** Lock pra evitar race condition: dois envios simultâneos gerando chaves diferentes. */
const pendingKeyCreation = new Map<string, Promise<CryptoKey>>();

/** Obtém (ou cria) a chave simétrica da conversa. */
async function getOrCreateConversationKey(
  conversationId: string,
  participantIds: string[],
): Promise<CryptoKey> {
  const cached = conversationKeyCache.get(conversationId);
  if (cached) return cached;

  // Evita race: se outra chamada já está criando a chave, espera por ela.
  const pending = pendingKeyCreation.get(conversationId);
  if (pending) return pending;

  const promise = createOrFetchKey(conversationId, participantIds);
  pendingKeyCreation.set(conversationId, promise);
  try {
    return await promise;
  } finally {
    pendingKeyCreation.delete(conversationId);
  }
}

async function createOrFetchKey(
  conversationId: string,
  participantIds: string[],
): Promise<CryptoKey> {
  // Tenta buscar do backend (já foi distribuída antes).
  const existing = await e2eApi.myConversationKey(conversationId);
  if (existing.encryptedKey) {
    const privateKeyBase64 = await getLocalPrivateKey();
    if (privateKeyBase64) {
      try {
        const privateKey = await importPrivateKey(privateKeyBase64);
        const symmetricKeyBase64 = await decryptWithPrivateKey(existing.encryptedKey, privateKey);
        const key = await importSymmetricKey(symmetricKeyBase64);
        conversationKeyCache.set(conversationId, key);
        return key;
      } catch {
        // Keypair diferente (outro device gerou) — gera nova chave pra esta conversa.
        // Mensagens antigas cifradas com a chave anterior ficam indecifráveis neste device.
      }
    }
  }

  // Não existe ou não conseguiu decifrar: gera e distribui.
  const newKey = await generateConversationKey();
  const symmetricKeyBase64 = await exportSymmetricKey(newKey);

  const pubKeys = await Promise.all(
    participantIds.map(async (userId) => ({ userId, view: await e2eApi.userPublicKey(userId) })),
  );
  const distributions: Array<{ userId: string; encryptedKey: string }> = [];
  for (const { userId, view } of pubKeys) {
    if (!view.publicKey) continue;
    const recipientPubKey = await importPublicKey(view.publicKey);
    const encrypted = await encryptForRecipient(symmetricKeyBase64, recipientPubKey);
    distributions.push({ userId, encryptedKey: encrypted });
  }

  await e2eApi.distributeConversationKey(conversationId, distributions);
  conversationKeyCache.set(conversationId, newKey);
  return newKey;
}

/** Cifra uma mensagem pra envio E2E. */
export async function encryptForSend(
  conversationId: string,
  plaintext: string,
  participantIds: string[],
): Promise<{ ciphertext: string; iv: string }> {
  const key = await getOrCreateConversationKey(conversationId, participantIds);
  return encryptMessage(plaintext, key);
}

/** Decifra uma mensagem recebida com e2e=true. Retorna o texto em claro. */
export async function decryptReceived(message: Message): Promise<string> {
  if (!message.e2e || !message.iv) return message.text;

  const cached = conversationKeyCache.get(message.conversationId);
  if (cached) {
    try {
      return await decryptMessage(message.text, message.iv, cached);
    } catch {
      return "[Não foi possível decifrar esta mensagem]";
    }
  }

  // Busca a chave da conversa.
  const existing = await e2eApi.myConversationKey(message.conversationId);
  if (!existing.encryptedKey) return "[Mensagem cifrada — chave não disponível]";

  const privateKeyBase64 = await getLocalPrivateKey();
  if (!privateKeyBase64) return "[Mensagem cifrada — configure o E2E]";

  try {
    const privateKey = await importPrivateKey(privateKeyBase64);
    const symmetricKeyBase64 = await decryptWithPrivateKey(existing.encryptedKey, privateKey);
    const key = await importSymmetricKey(symmetricKeyBase64);
    conversationKeyCache.set(message.conversationId, key);
    return await decryptMessage(message.text, message.iv, key);
  } catch {
    return "[Mensagem cifrada — chave não disponível]";
  }
}

/** Limpa o cache (logout, troca de chave). */
export function clearConversationKeyCache(): void {
  conversationKeyCache.clear();
}
