#!/usr/bin/env node

import type { EndpointDoIndice } from "@/types/application/developers/endpoint-do-indice";
import type { EndpointDocumentado } from "@/types/application/developers/endpoint-documentado";
import type { EndpointDocumentadoComEscopo } from "@/types/application/developers/endpoint-documentado-com-escopo";
import type { RespostaSondada } from "@/types/application/developers/resposta-sondada";

import { apiSections, apiUseCases } from "../src/constants/developers-api";
import { confereEscopos, confereMatrizComIndice } from "../src/lib/developers/api-matrix-check";

/**
 * Confere a matriz documentada da pagina `/developers` contra o indice real da API.
 *
 * O indice (`GET /api/v1`) e montado pelo backend a partir do roteador de verdade, entao ele e a
 * fonte da verdade. A matriz da pagina e escrita a mao: enquanto ninguem repetir a conta, ela
 * envelhece. Este script faz a conta.
 *
 * Uso:  npm run check:api-matrix            (usa a QA)
 *       API_INDEX_URL=... npm run check:api-matrix
 */

const INDICE_PADRAO = "https://enois-api-qa.b7cloud.tech/api/v1";
const ORIGEM_PADRAO = "https://enois-qa.b7cloud.tech";

const indiceUrl = process.env.API_INDEX_URL ?? INDICE_PADRAO;
const origem = process.env.API_CLIENT_ORIGIN ?? ORIGEM_PADRAO;

/** Os pares (metodo, caminho) que a pagina promete. */
function documentados(): EndpointDocumentado[] {
  const pares: EndpointDocumentado[] = [];
  for (const secao of apiSections) {
    for (const endpoint of secao.endpoints) {
      pares.push({ method: endpoint.method, path: endpoint.path });
    }
  }
  // Os casos de uso repetem rotas que ja estao nas secoes; entram tambem na conferencia.
  for (const caso of apiUseCases) {
    for (const passo of caso.steps) {
      const par = passoDeExemplo(passo.code);
      if (par) pares.push(par);
    }
  }
  return pares;
}

/** Tokens de um comando, ignorando o conteudo entre aspas. */
function tokens(comando: string): string[] {
  const Achados: string[] = [];
  const padrao = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let achado = padrao.exec(comando);
  while (achado !== null) {
    Achados.push(achado[1] ?? achado[2] ?? achado[3] ?? "");
    achado = padrao.exec(comando);
  }
  return Achados;
}

/** Extrai (metodo, caminho) de um exemplo em curl. */
function passoDeExemplo(comando: string | undefined): EndpointDocumentado | null {
  if (!comando) return null;
  const partes = tokens(comando);
  const inicio = partes.findIndex((parte) => parte.toLowerCase() === "curl");
  if (inicio < 0) return null;

  const metodo = partes.find((parte) => /^-X$/i.test(parte) || /^-request$/i.test(parte));
  const indiceDoMetodo = metodo ? partes.indexOf(metodo) : -1;
  const verbo = indiceDoMetodo >= 0 ? partes[indiceDoMetodo + 1] : undefined;

  // O alvo e o primeiro token depois do "curl" que comeca por http ou barra.
  let alvo: string | undefined;
  for (let i = inicio + 1; i < partes.length; i += 1) {
    const parte = partes[i] ?? "";
    if (parte.startsWith("-")) continue;
    if (parte.startsWith("http") || parte.startsWith("/")) {
      alvo = parte;
      break;
    }
  }
  if (!alvo) return null;

  let caminho = alvo;
  if (alvo.startsWith("http")) {
    try {
      caminho = new URL(alvo).pathname;
    } catch {
      return null;
    }
  }
  // O indice e relativo a /api (o alias mora em /api/v1).
  caminho = caminho.replace(/^\/api(?=\/|$)/, "");

  return {
    method: verbo && /^(GET|POST|PUT|PATCH|DELETE)$/i.test(verbo) ? verbo.toUpperCase() : "GET",
    path: caminho,
  };
}

async function indice(): Promise<EndpointDoIndice[]> {
  const resposta = await fetch(indiceUrl, {
    headers: { Accept: "application/json", "X-Client-Origin": origem },
  });
  if (!resposta.ok) {
    throw new Error(`indice indisponivel: HTTP ${resposta.status} em ${indiceUrl}`);
  }
  const corpo = (await resposta.json()) as { endpoints?: EndpointDoIndice[] };
  if (!Array.isArray(corpo.endpoints) || corpo.endpoints.length === 0) {
    throw new Error(`indice sem endpoints: ${indiceUrl}`);
  }
  return corpo.endpoints;
}

/** Os endpoints da matriz com o escopo que a pagina promete. */
function documentadosComEscopo(): EndpointDocumentadoComEscopo[] {
  const lista: EndpointDocumentadoComEscopo[] = [];
  for (const secao of apiSections) {
    for (const endpoint of secao.endpoints) {
      lista.push({ method: endpoint.method, path: endpoint.path, access: endpoint.access });
    }
  }
  return lista;
}

/**
 * Chama a rota documentada **sem sessao** e guarda o status.
 *
 * Só leitura (GET) e só rota sem variavel no caminho (com `{id}` a sondagem nao saberia o que
 * pedir). A origem e a da propria API: a pergunta aqui e sobre credencial, nao sobre origem
 * (quem integra usa a origem dele, cadastrada).
 */
async function sondaEscopos(
  documentados: EndpointDocumentadoComEscopo[],
): Promise<RespostaSondada[]> {
  const respostas: RespostaSondada[] = [];
  for (const endpoint of documentados) {
    if (endpoint.method.toUpperCase() !== "GET") continue;
    if (endpoint.path.includes("{") || endpoint.path.includes("$")) continue;
    try {
      const resposta = await fetch(`${indiceUrl.replace(/\/v1$/, "")}${endpoint.path}`, {
        headers: { Accept: "application/json", "X-Client-Origin": origem },
        redirect: "manual",
      });
      respostas.push({ path: endpoint.path, status: resposta.status });
    } catch {
      // Falha de rede nao diz nada sobre escopo: segue sem julgar esta rota.
    }
  }
  return respostas;
}

const lista = await indice();
const documentadosDaPagina = documentados();
const divergencia = confereMatrizComIndice(documentadosDaPagina, lista);
const escopos = confereEscopos(
  documentadosComEscopo(),
  await sondaEscopos(documentadosComEscopo()),
);

console.log(`Matriz: ${documentadosDaPagina.length} pares documentados.`);
console.log(`Indice: ${lista.length} rotas em ${indiceUrl}`);

console.log(
  `Escopos: ${escopos.publicasQueExigemSessao.length} promete publicas e exigem sessao, ` +
    `${escopos.fechadasQueRespondem.length} promete fechadas e respondem sem sessao.`,
);

const problemas =
  divergencia.documentadosInexistentes.length +
  divergencia.metodoDivergente.length +
  escopos.publicasQueExigemSessao.length +
  escopos.fechadasQueRespondem.length;
if (problemas === 0) {
  console.log("Tudo bate: a pagina documenta so o que existe, com o escopo certo.");
  process.exit(0);
}

if (escopos.publicasQueExigemSessao.length > 0) {
  console.error("\nPrometidas como publicas, mas a API exige sessao:");
  for (const item of escopos.publicasQueExigemSessao) {
    console.error(`  ${item}`);
  }
}
if (escopos.fechadasQueRespondem.length > 0) {
  console.error("\nPrometidas como fechadas, mas a API responde sem sessao:");
  for (const item of escopos.fechadasQueRespondem) {
    console.error(`  ${item}`);
  }
}

if (divergencia.documentadosInexistentes.length > 0) {
  console.error("\nDocumentados e inexistentes na API:");
  for (const item of divergencia.documentadosInexistentes) {
    console.error(`  ${item}`);
  }
}
if (divergencia.metodoDivergente.length > 0) {
  console.error("\nMetodo diferente do que a API tem:");
  for (const item of divergencia.metodoDivergente) {
    console.error(`  ${item}`);
  }
}
console.error("\nCorrija a matriz (src/constants/developers-api.ts) ou a API.");
process.exitCode = 1;
