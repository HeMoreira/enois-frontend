import type { ReactionSummary } from "@/types/application/reaction/reaction-summary";
import type { ReactionType } from "@/types/application/reaction/reaction-type";

export type CommentReactionsSummaryProps = {
  /** Contagem por tipo vinda do servidor e atualizada de forma otimista ao reagir. */
  summary: ReactionSummary;
  /** Reação de quem está vendo. */
  mine: ReactionType | null;
  /** Reagir/trocar/remover pelo mesmo caminho do seletor. */
  onToggle: (type: ReactionType) => void;
};
