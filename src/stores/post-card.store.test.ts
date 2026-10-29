import type { PostCardState } from "@/types/stores/post-card-state";
import { describe, expect, it } from "vitest";

import { selectCommentMentions } from "./post-card.store";

/**
 * O `useSyncExternalStore` (zustand) compara o snapshot por REFERÊNCIA. Um seletor que devolve
 * `?? []` cria um array novo a cada leitura → o React entende que o estado mudou e renderiza de
 * novo: é o aviso "The result of getSnapshot should be cached to avoid an infinite loop".
 *
 * Em 2026-10-24 isso acontecia na página do post (o primeiro render, antes do card entrar no
 * store) e no post do blog (que nunca registra o card). O conserto é devolver a MESMA referência
 * quando não há nada — este teste trava isso.
 */
describe("seletores do store de cards", () => {
  /** Card de exemplo com todos os campos do estado. */
  function card(): PostCardState {
    return {
      draft: "",
      commentMentions: [],
      replyToId: null,
      reactionPending: false,
      showReactions: false,
      showSeals: false,
      showReport: false,
    };
  }

  it("devolve a mesma referência quando o post não está no store", () => {
    const primeira = selectCommentMentions("post_inexistente")({ cards: {} });
    const segunda = selectCommentMentions("post_inexistente")({ cards: {} });
    expect(primeira).toBe(segunda);
    expect(primeira).toEqual([]);
  });

  it("devolve o valor do store quando o post existe", () => {
    const estado = { cards: { post_1: { ...card(), commentMentions: ["@ana"] } } };
    expect(selectCommentMentions("post_1")(estado)).toEqual(["@ana"]);
  });
});
