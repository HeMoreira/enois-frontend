import type { DivergenciaDaMatriz } from "@/types/application/developers/divergencia-da-matriz";
import type { DivergenciaDeEscopo } from "@/types/application/developers/divergencia-de-escopo";
import type { EndpointDoIndice } from "@/types/application/developers/endpoint-do-indice";
import type { EndpointDocumentado } from "@/types/application/developers/endpoint-documentado";
import type { EndpointDocumentadoComEscopo } from "@/types/application/developers/endpoint-documentado-com-escopo";
import type { RespostaSondada } from "@/types/application/developers/resposta-sondada";

/**
 * Confere a matriz documentada da pagina `/developers` contra o indice real da API
 * (`GET /api/v1`, montado pelo backend a partir do roteador de verdade).
 *
 * Ate aqui essa conferencia era manual: um roteiro de auditoria comparava os 134 pares
 * (metodo, caminho) da pagina com os `@*Mapping` do backend. Manual nao e trava - a lista muda
 * todo dia e ninguem repete a conta. Aqui a regra virou codigo: a funcao e pura (entra a matriz e
 * o indice, sai a divergencia) e o script `scripts/check-api-matrix.ts` busca o indice ao vivo e
 * chama ela.
 */

/**
 * O caminho, partido em segmentos (sem query e sem barra final).
 *
 * A comparacao e por segmento, como o roteador faz: um segmento com variavel casa com qualquer
 * valor. Do lado da pagina, a variavel pode ser `{id}` ou `$ID` (nos exemplos em curl); do lado do
 * indice, e sempre `{id}`.
 */
export function segmentosDoCaminho(caminho: string): string[] {
  return (
    caminho
      .split("?")[0]
      ?.trim()
      .split("/")
      .filter((segmento) => segmento.length > 0) ?? []
  );
}

/** O segmento e um placeholder (variavel) em vez de um valor fixo? */
function eVariavel(segmento: string): boolean {
  return segmento.startsWith("{") || segmento.startsWith("$");
}

/**
 * Compara os dois conjuntos.
 *
 * O indice e a fonte da verdade: uma rota que a pagina documenta e o indice nao tem e uma promessa
 * quebrada. Uma rota que o indice tem e a pagina nao documenta NAO e erro - a pagina e uma
 * curadoria (nem toda rota interna interessa a quem integra).
 */
export function confereMatrizComIndice(
  documentados: EndpointDocumentado[],
  indice: EndpointDoIndice[],
): DivergenciaDaMatriz {
  const caminhosDoIndice = indice.map((endpoint) => ({
    metodo: endpoint.method.toUpperCase(),
    segmentos: segmentosDoCaminho(endpoint.path),
  }));

  const documentadosInexistentes: string[] = [];
  const metodoDivergente: string[] = [];

  for (const endpoint of documentados) {
    const segmentos = segmentosDoCaminho(endpoint.path);
    const metodo = endpoint.method.toUpperCase();
    const rotulo = `${metodo} /${segmentos.join("/")}`;

    const candidatos = caminhosDoIndice.filter((rota) => {
      if (rota.segmentos.length !== segmentos.length) return false;
      return rota.segmentos.every((segmento, posicao) => {
        const daPagina = segmentos[posicao] ?? "";
        return eVariavel(segmento) || eVariavel(daPagina) || segmento === daPagina;
      });
    });

    if (candidatos.length === 0) {
      documentadosInexistentes.push(rotulo);
      continue;
    }
    if (!candidatos.some((rota) => rota.metodo === metodo || rota.metodo === "ANY")) {
      const metodos = [...new Set(candidatos.map((rota) => rota.metodo))].sort();
      metodoDivergente.push(`${rotulo} (a API tem ${metodos.join(", ")})`);
    }
  }

  return {
    documentadosInexistentes: documentadosInexistentes.sort(),
    metodoDivergente: metodoDivergente.sort(),
  };
}

/**
 * Confere o **escopo** declarado na matriz contra o que a API responde sem sessao.
 *
 * A matriz diz, para cada rota, se ela e `public`, `auth` ou `admin` — e e o que quem integra
 * acredita. A pergunta e respondivel: chamar a rota **sem sessao**. Se a rota marcada como
 * `public` responde 401/403, a pagina esta prometendo algo que a API nao entrega (e quem copiou
 * o exemplo leva um 401 na cara); se uma rota marcada como `auth`/`admin` responde 200, a
 * pagina esta escondendo uma rota publica.
 *
 * As respostas vem da sondagem (o script chama a rota e guarda o status); aqui so a comparacao,
 * que e pura e testada.
 */
export function confereEscopos(
  documentados: EndpointDocumentadoComEscopo[],
  respostas: RespostaSondada[],
): DivergenciaDeEscopo {
  const statusPorCaminho = new Map<string, number>();
  for (const resposta of respostas) {
    statusPorCaminho.set(normalizaCaminhoParaChave(resposta.path), resposta.status);
  }

  const publicasQueExigemSessao: string[] = [];
  const fechadasQueRespondem: string[] = [];

  for (const endpoint of documentados) {
    if (endpoint.method.toUpperCase() !== "GET") continue;
    const status = statusPorCaminho.get(normalizaCaminhoParaChave(endpoint.path));
    if (status === undefined) continue;
    const responde = status === 200 || status === 204;
    if (endpoint.access === "public" && !responde) {
      publicasQueExigemSessao.push(`${endpoint.method.toUpperCase()} ${endpoint.path} (${status})`);
    }
    if (endpoint.access !== "public" && responde) {
      fechadasQueRespondem.push(`${endpoint.method.toUpperCase()} ${endpoint.path} (${status})`);
    }
  }

  return {
    publicasQueExigemSessao: publicasQueExigemSessao.sort(),
    fechadasQueRespondem: fechadasQueRespondem.sort(),
  };
}

function normalizaCaminhoParaChave(caminho: string): string {
  return segmentosDoCaminho(caminho).join("/");
}
