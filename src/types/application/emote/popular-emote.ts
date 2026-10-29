/**
 * Uma linha do retrato `public/emotes/popular.json` (ver `scripts/update-popular-emotes.mjs`).
 * Sem provedor: a fonte é sempre o FrankerFaceZ (o BTTV não publica a própria lista popular para
 * fora do site dele).
 */
export type PopularEmote = {
  code: string;
  url: string;
  preview: string;
};
