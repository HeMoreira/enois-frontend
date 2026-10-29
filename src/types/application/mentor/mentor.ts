export type Mentor = {
  id: string;
  userId: string;
  expertise: string[];
  rating: number;
  sessions: number;
  price: string;
  /** Banner/capa do perfil de mentor (URL do CDN). */
  banner: string | null;
  /**
   * Próxima vaga livre — **nulo** quando o mentor não tem nenhuma vaga futura (é o que a API
   * devolve: `nextAvailableSlot` termina em `orElse(null)`). Medido na QA em 2026-10-24: 2 de
   * 5 mentores da lista vinham com o campo nulo.
   */
  nextSlot: string | null;
};
