export type Message = {
  id: string;
  conversationId: string;
  from: string;
  text: string;
  /** Até 4 mídias anexadas; o texto pode vir vazio quando há mídia. */
  mediaIds: string[];
  /** Quando true, imagens e vídeos da mensagem começam ocultos. */
  mediaSpoiler?: boolean;
  time: string;
  /** Reações da mensagem: tipo → contagem (vem do backend no histórico). */
  reactions?: Record<string, number>;
  /** A reação de quem está vendo (para destacar e permitir desfazer). */
  myReaction?: string | null;
  /** Mensagem cifrada ponta a ponta. O campo text contém ciphertext base64. */
  e2e?: boolean;
  /** IV usado na cifragem (base64). Presente quando e2e=true. */
  iv?: string | null;
};
