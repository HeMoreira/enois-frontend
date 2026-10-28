/** Resultado do botão "Recalcular agora". */
export type MonitoringEconomyRecalculation = {
  publicada: boolean;
  cotacaoAnteriorMicros: number;
  cotacaoAtualMicros: number;
  escassez: number;
  indice: number;
  usoEscrow: number;
  usoP2p: number;
  retornoCofre: number;
  emissao: number;
  circulacao: number;
  cofre: number;
  /**
   * Fração do período diário já decorrida desde a última publicação (0 a 1). O valor só anda
   * nessa proporção — clicar de novo no mesmo dia não soma períodos.
   */
  periodoDecorrido: number;
  /** Quando a próxima reavaliação (com passo completo) acontece. */
  proximaAvaliacaoEm: string;
};
