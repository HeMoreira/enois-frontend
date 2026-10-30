import type { PageResponse } from "../api/page-response";
import type { PostView } from "./post-view";

/** Página do `GET /feed`: a primeira traz o marcador "Você está em dia" de antes desta visita. */
export type FeedPage = PageResponse<PostView> & {
  /** ISO ou `null` (nunca marcou). Páginas com cursor sempre mandam `null`. */
  lastSeenAt?: string | null;
};
