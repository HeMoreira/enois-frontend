/**
 * E2E crypto: geração de keypair, derivação de chave da senha, cifrar/decifrar.
 * Usa WebCrypto API nativa do browser — sem dependência externa.
 */

const PBKDF2_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

/** Gera um par de chaves RSA-OAEP pra E2E. */
export async function generateKeypair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  );
}

/** Exporta chave pública em base64 (formato spki). */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("spki", key);
  return bufferToBase64(raw);
}

/** Importa chave pública de base64 (formato spki). */
export async function importPublicKey(base64: string): Promise<CryptoKey> {
  const raw = base64ToBuffer(base64);
  return crypto.subtle.importKey("spki", raw, { name: "RSA-OAEP", hash: "SHA-256" }, true, [
    "encrypt",
  ]);
}

/** Exporta chave privada em base64 (formato pkcs8). */
export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("pkcs8", key);
  return bufferToBase64(raw);
}

/** Importa chave privada de base64 (formato pkcs8). */
export async function importPrivateKey(base64: string): Promise<CryptoKey> {
  const raw = base64ToBuffer(base64);
  return crypto.subtle.importKey("pkcs8", raw, { name: "RSA-OAEP", hash: "SHA-256" }, true, [
    "decrypt",
  ]);
}

/** Deriva uma chave AES-256-GCM da senha do usuário (pra cifrar a chave privada). */
async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const params: Pbkdf2Params = {
    name: "PBKDF2",
    salt: salt.buffer as ArrayBuffer,
    iterations: PBKDF2_ITERATIONS,
    hash: "SHA-256",
  };
  const derived: AesDerivedKeyParams = { name: "AES-GCM", length: 256 };
  const usages: KeyUsage[] = ["encrypt", "decrypt"];
  return crypto.subtle.deriveKey(params, keyMaterial, derived, false, usages);
}

/** Cifra a chave privada com a senha do usuário. Retorna salt + iv + ciphertext em base64. */
export async function encryptPrivateKey(
  privateKeyBase64: string,
  password: string,
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const derivedKey = await deriveKeyFromPassword(password, salt);
  const plaintext = base64ToBuffer(privateKeyBase64);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, derivedKey, plaintext);
  // Formato: salt(16) + iv(12) + ciphertext — tudo em base64
  const combined = new Uint8Array(salt.length + iv.length + new Uint8Array(ciphertext).length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);
  return bufferToBase64(combined.buffer);
}

/** Decifra a chave privada com a senha do usuário. */
export async function decryptPrivateKey(
  encryptedBase64: string,
  password: string,
): Promise<string> {
  const combined = new Uint8Array(base64ToBuffer(encryptedBase64));
  const salt = combined.slice(0, SALT_BYTES);
  const iv = combined.slice(SALT_BYTES, SALT_BYTES + IV_BYTES);
  const ciphertext = combined.slice(SALT_BYTES + IV_BYTES);
  const derivedKey = await deriveKeyFromPassword(password, salt);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, derivedKey, ciphertext);
  return bufferToBase64(plaintext);
}

/** Gera chave simétrica AES-256-GCM pra uma conversa. */
export async function generateConversationKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}

/** Exporta chave simétrica em base64. */
export async function exportSymmetricKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return bufferToBase64(raw);
}

/** Importa chave simétrica de base64. */
export async function importSymmetricKey(base64: string): Promise<CryptoKey> {
  const raw = base64ToBuffer(base64);
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}

/** Cifra a chave simétrica da conversa com a chave pública do destinatário. */
export async function encryptForRecipient(
  symmetricKeyBase64: string,
  recipientPublicKey: CryptoKey,
): Promise<string> {
  const raw = base64ToBuffer(symmetricKeyBase64);
  const encrypted = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, recipientPublicKey, raw);
  return bufferToBase64(encrypted);
}

/** Decifra a chave simétrica da conversa com a própria chave privada. */
export async function decryptWithPrivateKey(
  encryptedBase64: string,
  privateKey: CryptoKey,
): Promise<string> {
  const raw = base64ToBuffer(encryptedBase64);
  const decrypted = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, raw);
  return bufferToBase64(decrypted);
}

/** Cifra uma mensagem com a chave simétrica da conversa. Retorna { ciphertext, iv } em base64. */
export async function encryptMessage(
  plaintext: string,
  conversationKey: CryptoKey,
): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, conversationKey, encoded);
  return { ciphertext: bufferToBase64(encrypted), iv: bufferToBase64(iv.buffer) };
}

/** Decifra uma mensagem com a chave simétrica da conversa. */
export async function decryptMessage(
  ciphertextBase64: string,
  ivBase64: string,
  conversationKey: CryptoKey,
): Promise<string> {
  const ciphertext = base64ToBuffer(ciphertextBase64);
  const iv = base64ToBuffer(ivBase64);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    conversationKey,
    ciphertext,
  );
  return new TextDecoder().decode(decrypted);
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
