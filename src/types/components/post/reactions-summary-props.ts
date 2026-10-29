import type { PostView } from "@/types/application/feed/post-view";
import type { ReactionSummary } from "@/types/application/reaction/reaction-summary";

export type ReactionsSummaryProps = {
  post: PostView;
  /** Resumo que veio com o post; quando presente, o componente não busca nada. */
  initialSummary?: ReactionSummary | null;
};
