import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Card dentro de uma coluna de grid não pode esticar a coluna.
 *
 * Item de grid nasce com `min-width: auto`, ou seja, o mínimo dele é o **min-content** do
 * conteúdo. Quando o card tem um título que não quebra (truncate/`nowrap`) ou uma palavra
 * gigante sem espaço, esse min-content é maior que a tela: a coluna cresce, o card sai do
 * container e a **página passa a rolar de lado no celular**.
 *
 * Medido em 2026-10-24 (Chrome headless, 360px, com dado real da QA): a lista de serviços
 * estourava 31px (e 572px com título longo) e a de freelas 417px. Com `min-w-0` no item (e
 * `break-words` no título que não pode truncar), o overflow vai a zero.
 *
 * Este teste trava a regra nos dois cards que quebraram: quem criar card novo em grid precisa
 * do `min-w-0`.
 */
function fonte(caminho: string): string {
  return readFileSync(join(process.cwd(), caminho), "utf8");
}

describe("card em coluna de grid", () => {
  it("o card de oferta (serviços) pode encolher até a coluna", () => {
    const conteudo = fonte("src/routes/servicos.tsx");
    const card = conteudo.match(/<li id=\{`oferta-\$\{listing\.id\}`\} className="([^"]*)"/);
    expect(card).not.toBeNull();
    expect(card![1]).toContain("min-w-0");
  });

  it("o card de freelance pode encolher até a coluna", () => {
    const conteudo = fonte("src/routes/freelances.tsx");
    const card = conteudo.match(/<li className="(surface-card[^"]*)"/);
    expect(card).not.toBeNull();
    expect(card![1]).toContain("min-w-0");
  });

  it("o título do freelance quebra palavra (o do prestador é texto do usuário)", () => {
    const conteudo = fonte("src/routes/freelances.tsx");
    const titulo = conteudo.match(/<h2 className="([^"]*)"[^>]*>\{item\.title\}<\/h2>/);
    expect(titulo).not.toBeNull();
    expect(titulo![1]).toContain("break-words");
  });
});
