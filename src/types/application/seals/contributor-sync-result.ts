/** Resultado da verificação sob demanda do vínculo GitHub. */
export type ContributorSyncResult = {
  /** PRs integrados encontrados (criados ou atualizados). */
  contributions: number;
  /** Issues qualificadas encontradas (criadas ou atualizadas). */
  issues: number;
  /** Categorias recalculadas a partir das evidências. */
  seals: number;
  rateLimited: boolean;
};
