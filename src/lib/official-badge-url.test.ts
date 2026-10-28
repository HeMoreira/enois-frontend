import { describe, expect, it } from "vitest";

import { officialBadgeDataUrl, resolveBadgeMediaUrl } from "./official-badge-url";

describe("emblema oficial como imagem", () => {
  it("desenha o emblema oficial como SVG em data URL", () => {
    const url = officialBadgeDataUrl("emblema-carapuca");
    expect(url).toMatch(/^data:image\/svg\+xml/);
    expect(decodeURIComponent(url ?? "")).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it("não inventa imagem para emblema oficial desconhecido", () => {
    expect(officialBadgeDataUrl("emblema-nao-existe")).toBeUndefined();
  });

  it("mantém o emblema enviado pelo CDN", () => {
    expect(resolveBadgeMediaUrl("https://cdn.example/b.png")).toBe("https://cdn.example/b.png");
    expect(resolveBadgeMediaUrl("emblema-carapuca")).toMatch(/^data:image\/svg\+xml/);
  });
});
