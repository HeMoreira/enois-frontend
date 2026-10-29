/**
 * O arquivo `specs/openapi.json` do repo e, hoje, um ESQUELETO: nao ha documento OpenAPI da API
 * (o springdoc saiu do backend no lote de seguranca), entao a rota `/openapi.json` responde como
 * qualquer caminho desconhecido — 200 sem corpo.
 *
 * Estas funcoes sao o filtro que impede o esqueleto de passar por documento: a geracao de cliente
 * (orval) e o script de fetch conferem antes de rodar.
 */

const SEM_OPENAPI = [
  "O backend nao publica documento OpenAPI (o springdoc saiu no lote de seguranca; ver",
  "src/main/java/com/socialcoisa/rede/shared/web/OperationalController.java no repo do backend).",
  "O contrato da API esta na pagina /developers do app e no indice GET /api/v1.",
].join(" ");

/** O texto que os scripts escrevem quando nao ha documento. */
export function avisoSemOpenApi(): string {
  return SEM_OPENAPI;
}

/** O objeto tem a forma de um documento OpenAPI utilizavel (com rotas)? */
export function eDocumentoDeOpenApi(spec: unknown): boolean {
  if (typeof spec !== "object" || spec === null) return false;
  const candidato = spec as { openapi?: unknown; paths?: unknown };
  if (typeof candidato.openapi !== "string") return false;
  const caminhos = candidato.paths;
  if (typeof caminhos !== "object" || caminhos === null) return false;
  return Object.keys(caminhos).length > 0;
}
