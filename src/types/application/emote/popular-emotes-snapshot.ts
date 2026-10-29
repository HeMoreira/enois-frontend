import type { PopularEmote } from "./popular-emote";

/**
 * Retrato das figurinhas mais usadas, publicado junto do app em `public/emotes/popular.json`.
 *
 * O arquivo é gerado por `scripts/update-popular-emotes.mjs` a partir do catálogo público do
 * FrankerFaceZ ordenado por uso — o seletor abre com a lista cheia e sem pagar a consulta lenta
 * do provedor na hora do clique.
 */
export type PopularEmotesSnapshot = {
  emotes?: PopularEmote[];
  generatedAt?: string;
  totalAvailable?: number;
};
