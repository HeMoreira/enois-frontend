import { QueryClient } from "@tanstack/react-query";

import type { PostView } from "@/types/application/feed/post-view";
import { describe, expect, it } from "vitest";

import { updatePostInQueryCache } from "./post-query-cache";

const post = (id: string, reactions = 0): PostView =>
  ({ id, counters: { reactions, comments: 0, saves: 0, shares: 0 } }) as PostView;

/**
 * O prefixo `["feed"]` alcança consultas vizinhas que guardam LISTA (ex.: `["feed","scheduled"]`).
 * Antes, atualizar a reação estourava `pages.map` nelas e a ação morria antes do servidor.
 */
describe("updatePostInQueryCache", () => {
  it("não quebra quando existe consulta vizinha com lista no prefixo feed", () => {
    const client = new QueryClient();
    client.setQueryData(["feed", "scheduled"], []);
    client.setQueryData(["feed", { tab: "FOR_YOU" }], {
      pages: [{ items: [post("p1")], nextCursor: null }],
      pageParams: [null],
    });

    expect(() =>
      updatePostInQueryCache(client, "p1", (current) => ({
        ...current,
        counters: { ...current.counters, reactions: 1 },
      })),
    ).not.toThrow();

    const feed = client.getQueryData<{
      pages: { items: PostView[] }[];
    }>(["feed", { tab: "FOR_YOU" }]);
    expect(feed?.pages[0].items[0].counters.reactions).toBe(1);
    expect(client.getQueryData(["feed", "scheduled"])).toEqual([]);
  });

  it("atualiza a cópia isolada do post quando existe", () => {
    const client = new QueryClient();
    client.setQueryData(["post", "p2"], post("p2", 3));
    updatePostInQueryCache(client, "p2", (current) => ({
      ...current,
      counters: { ...current.counters, reactions: 9 },
    }));
    expect((client.getQueryData(["post", "p2"]) as PostView).counters.reactions).toBe(9);
  });
});
