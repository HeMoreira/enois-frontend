import type { GlobalEmote } from "@/types/application/emote/global-emote";
import type { PopularEmote } from "@/types/application/emote/popular-emote";
import type { PopularEmotesSnapshot } from "@/types/application/emote/popular-emotes-snapshot";

/**
 * As figurinhas MAIS USADAS, servidas pelo próprio app em `/emotes/popular.json`.
 *
 * O catálogo global (`cached/emotes/global` do BTTV e `set/global` do FrankerFaceZ) é curto: ~88
 * figurinhas. O FrankerFaceZ publica o catálogo inteiro ordenado por uso, mas cada página dele
 * demora de 8 a 30 segundos — inviável no clique. Por isso o retrato, ordenado por uso, é gerado
 * fora do horário de uso (`scripts/update-popular-emotes.mjs`) e publicado junto do build:
 *
 * - **rápido**: um arquivo estático nosso, sem depender de API de terceiro na hora de abrir;
 * - **igual para todo mundo**: o catálogo de renderização é o mesmo, então a figurinha escolhida
 *   por uma pessoa aparece no texto de todas as outras (o oposto de buscar em catálogo particular).
 *
 * A lista popular do BTTV (`betterttv.com/emotes/popular`) não entra: fora do domínio deles a API
 * responde `401/403` e o CORS só libera `https://betterttv.com`.
 */
const ARQUIVO = "/emotes/popular.json";

function isPopularEmote(valor: unknown): valor is PopularEmote {
  if (!valor || typeof valor !== "object") return false;
  const emote = valor as Record<string, unknown>;
  return (
    typeof emote.code === "string" &&
    emote.code !== "" &&
    typeof emote.url === "string" &&
    emote.url !== "" &&
    typeof emote.preview === "string" &&
    emote.preview !== ""
  );
}

/** O retrato já em formato de catálogo, com a posição de uso (`popularRank`) de cada figurinha. */
export async function fetchPopularEmotes(signal?: AbortSignal): Promise<GlobalEmote[]> {
  const response = await fetch(ARQUIVO, { signal });
  if (!response.ok) throw new Error(`Catálogo popular respondeu ${response.status}`);
  const dados = (await response.json()) as PopularEmotesSnapshot;
  if (!Array.isArray(dados?.emotes)) return [];

  const vistos = new Set<string>();
  const emotes: GlobalEmote[] = [];
  for (const emote of dados.emotes) {
    if (!isPopularEmote(emote) || vistos.has(emote.code)) continue;
    vistos.add(emote.code);
    emotes.push({
      code: emote.code,
      url: emote.url,
      preview: emote.preview,
      provider: "FFZ",
      popularRank: emotes.length + 1,
    });
  }
  return emotes;
}
