import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchPopularEmotes } from "./popular";

const RETRATO = {
  emotes: [
    { code: "OMEGALUL", url: "https://cdn.frankerfacez.com/emote/1/2", preview: "/1/1" },
    { code: "Pog", url: "https://cdn.frankerfacez.com/emote/2/2", preview: "/2/1" },
  ],
};

function stub(json: unknown, ok = true) {
  const fetch = vi.fn(async () => ({ ok, status: ok ? 200 : 404, json: async () => json }));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchPopularEmotes", () => {
  it("lê o retrato publicado pelo próprio app", async () => {
    const fetch = stub(RETRATO);

    await fetchPopularEmotes();

    expect(fetch).toHaveBeenCalledWith("/emotes/popular.json", expect.anything());
  });

  it("devolve as figurinhas na ordem de uso, marcadas com a posição", async () => {
    stub(RETRATO);

    expect(await fetchPopularEmotes()).toEqual([
      {
        code: "OMEGALUL",
        url: "https://cdn.frankerfacez.com/emote/1/2",
        preview: "/1/1",
        provider: "FFZ",
        popularRank: 1,
      },
      {
        code: "Pog",
        url: "https://cdn.frankerfacez.com/emote/2/2",
        preview: "/2/1",
        provider: "FFZ",
        popularRank: 2,
      },
    ]);
  });

  it("descarta linha incompleta e código repetido sem furar a numeração", async () => {
    stub({
      emotes: [
        { code: "OMEGALUL", url: "u", preview: "p" },
        { code: "SEMURL", preview: "p" },
        { code: "OMEGALUL", url: "u2", preview: "p2" },
        null,
        { code: "Pog", url: "u3", preview: "p3" },
      ],
    });

    const emotes = await fetchPopularEmotes();

    expect(emotes.map((emote) => emote.code)).toEqual(["OMEGALUL", "Pog"]);
    expect(emotes.map((emote) => emote.popularRank)).toEqual([1, 2]);
  });

  it("sem a lista no arquivo devolve vazio", async () => {
    stub({});

    expect(await fetchPopularEmotes()).toEqual([]);
  });

  it("arquivo fora do ar falha alto — quem chamou decide usar só as coleções globais", async () => {
    stub({}, false);

    await expect(fetchPopularEmotes()).rejects.toThrow("404");
  });

  it("o retrato publicado no repositório continua válido e grande", async () => {
    const publicado = JSON.parse(
      readFileSync(new URL("../../../public/emotes/popular.json", import.meta.url), "utf8"),
    );
    stub(publicado);

    const emotes = await fetchPopularEmotes();

    expect(emotes.length).toBeGreaterThanOrEqual(500);
    expect(emotes[0]?.code).toBe("OMEGALUL");
    expect(emotes[0]?.popularRank).toBe(1);
    expect(emotes.at(-1)?.popularRank).toBe(emotes.length);
  });
});
