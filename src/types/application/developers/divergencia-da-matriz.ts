/**
 * O que a conferencia achou entre a matriz documentada e o indice real.
 *
 * - `documentadosInexistentes`: a pagina promete uma rota que a API nao tem (quem copia o exemplo
 *   recebe "caminho fora da superficie", 200 sem corpo — e nao o 404 que ele espera).
 * - `metodoDivergente`: a rota existe, mas com outro metodo (a pagina manda POST onde so ha GET).
 */
export type DivergenciaDaMatriz = {
  documentadosInexistentes: string[];
  metodoDivergente: string[];
};
