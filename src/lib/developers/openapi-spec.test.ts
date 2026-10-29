import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { avisoSemOpenApi, eDocumentoDeOpenApi } from "./openapi-spec";

/**
 * O esqueleto `specs/openapi.json` ja enganou uma pessoa (e o plano): ele parece um documento,
 * mas nao tem rota nenhuma. O backend nao publica OpenAPI — o contrato esta na pagina
 * `/developers` e no indice `GET /api/v1`. Estes testes travam as duas metades: o arquivo do repo
 * e reconhecido como esqueleto, e a geracao de cliente recusa esqueleto.
 */
describe("documento OpenAPI da API", () => {
  const specDoRepo = JSON.parse(
    readFileSync(resolve(process.cwd(), "specs/openapi.json"), "utf8"),
  ) as unknown;

  it("o arquivo do repo NAO e um documento (e o esqueleto)", () => {
    expect(eDocumentoDeOpenApi(specDoRepo)).toBe(false);
  });

  it("o esqueleto declara onde esta o contrato de verdade", () => {
    const esqueleto = specDoRepo as { "x-enois"?: Record<string, unknown> };
    expect(esqueleto["x-enois"]?.["contrato-legivel"]).toBe("/developers");
    expect(esqueleto["x-enois"]?.["contrato-por-maquina"]).toBe("GET /api/v1");
    expect(esqueleto["x-enois"]?.["documento-real"]).toBe(false);
  });

  it("reconhece um documento de verdade", () => {
    expect(
      eDocumentoDeOpenApi({
        openapi: "3.0.3",
        paths: { "/feed": { get: {} } },
      }),
    ).toBe(true);
  });

  it("recusa o que nao e documento", () => {
    expect(eDocumentoDeOpenApi(null)).toBe(false);
    expect(eDocumentoDeOpenApi("openapi")).toBe(false);
    expect(eDocumentoDeOpenApi({ paths: {} })).toBe(false);
    expect(eDocumentoDeOpenApi({ openapi: "3.0.3" })).toBe(false);
    expect(eDocumentoDeOpenApi({ openapi: "3.0.3", paths: null })).toBe(false);
  });

  it("o aviso diz onde o contrato esta", () => {
    expect(avisoSemOpenApi()).toContain("/api/v1");
    expect(avisoSemOpenApi()).toContain("/developers");
  });
});
