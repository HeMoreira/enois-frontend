import type { EndpointDoIndice } from "@/types/application/developers/endpoint-do-indice";
import type { EndpointDocumentado } from "@/types/application/developers/endpoint-documentado";
import { describe, expect, it } from "vitest";

import { confereEscopos, confereMatrizComIndice, segmentosDoCaminho } from "./api-matrix-check";

/**
 * A pagina `/developers` promete uma API. O indice (`GET /api/v1`) e o que a API e de verdade.
 * A promessa fica valendo sozinha quando a conferencia e codigo — antes ela dependia de alguem
 * refazer a conta manual depois de cada endpoint novo.
 */
describe("conferencia da matriz de API", () => {
  const indice: EndpointDoIndice[] = [
    { method: "GET", path: "/feed" },
    { method: "POST", path: "/feed/posts" },
    { method: "GET", path: "/feed/posts/{postId}" },
    { method: "GET", path: "/feed/posts/{postId}/comments" },
    { method: "GET", path: "/communities" },
    { method: "GET", path: "/communities/{communityId}/feed" },
    { method: "GET", path: "/users/{username}/posts" },
  ];

  it("aceita uma matriz que bate com o indice", () => {
    const documentados: EndpointDocumentado[] = [
      { method: "GET", path: "/feed" },
      { method: "POST", path: "/feed/posts" },
      { method: "GET", path: "/feed/posts/{postId}" },
      { method: "GET", path: "/communities" },
    ];
    expect(confereMatrizComIndice(documentados, indice)).toEqual({
      documentadosInexistentes: [],
      metodoDivergente: [],
    });
  });

  it("acha o endpoint documentado que a API nao tem", () => {
    const documentados: EndpointDocumentado[] = [{ method: "GET", path: "/feed/antigos" }];
    expect(confereMatrizComIndice(documentados, indice).documentadosInexistentes).toEqual([
      "GET /feed/antigos",
    ]);
  });

  it("acha o metodo diferente no mesmo caminho", () => {
    const documentados: EndpointDocumentado[] = [{ method: "DELETE", path: "/feed" }];
    expect(confereMatrizComIndice(documentados, indice).metodoDivergente).toEqual([
      "DELETE /feed (a API tem GET)",
    ]);
  });

  it("o valor concreto da variavel casa (exemplo de curl com id)", () => {
    // A pagina documenta o caminho com variavel; o exemplo em curl traz um id concreto. E a
    // mesma rota, e o indice diz isso com a variavel.
    const documentados: EndpointDocumentado[] = [
      { method: "GET", path: "/feed/posts/post_0f1e2d3c4b5a69788796a5b4c3d2e1f0" },
      { method: "GET", path: "/feed/posts/post_0f1e2d3c4b5a69788796a5b4c3d2e1f0/comments" },
    ];
    expect(confereMatrizComIndice(documentados, indice).documentadosInexistentes).toEqual([]);
  });

  it("a variavel em caixa alta dos exemplos em curl tambem casa", () => {
    const documentados: EndpointDocumentado[] = [
      { method: "GET", path: "/communities/$COMMUNITY_ID/feed" },
    ];
    expect(confereMatrizComIndice(documentados, indice).documentadosInexistentes).toEqual([]);
  });

  it("o nome da variavel de caminho nao conta como divergencia", () => {
    const documentados: EndpointDocumentado[] = [
      { method: "GET", path: "/users/{username}/posts" },
    ];
    expect(confereMatrizComIndice(documentados, indice).documentadosInexistentes).toEqual([]);
  });

  it("a query string da pagina nao muda a rota", () => {
    const documentados: EndpointDocumentado[] = [{ method: "GET", path: "/feed?limit=20" }];
    expect(confereMatrizComIndice(documentados, indice).documentadosInexistentes).toEqual([]);
  });

  it("parte o caminho em segmentos, sem query e sem barra final", () => {
    expect(segmentosDoCaminho("/feed")).toEqual(["feed"]);
    expect(segmentosDoCaminho("/feed/")).toEqual(["feed"]);
    expect(segmentosDoCaminho("feed")).toEqual(["feed"]);
    expect(segmentosDoCaminho("/feed?limit=20")).toEqual(["feed"]);
    expect(segmentosDoCaminho("/users/{username}/")).toEqual(["users", "{username}"]);
    expect(segmentosDoCaminho("/")).toEqual([]);
  });
});

describe("conferência de escopo da matriz", () => {
  it("acha a rota prometida como pública que a API recusa sem sessão", () => {
    const divergencia = confereEscopos(
      [
        { method: "GET", path: "/daily-games/blocks/today", access: "public" },
        { method: "GET", path: "/daily-games/blocks/leaderboard", access: "public" },
      ],
      [
        { path: "/daily-games/blocks/today", status: 401 },
        { path: "/daily-games/blocks/leaderboard", status: 200 },
      ],
    );
    expect(divergencia.publicasQueExigemSessao).toEqual(["GET /daily-games/blocks/today (401)"]);
    expect(divergencia.fechadasQueRespondem).toEqual([]);
  });

  it("acha a rota prometida como fechada que responde sem sessão", () => {
    const divergencia = confereEscopos(
      [{ method: "GET", path: "/stats/community", access: "auth" }],
      [{ path: "/stats/community", status: 200 }],
    );
    expect(divergencia.fechadasQueRespondem).toEqual(["GET /stats/community (200)"]);
  });

  it("não julga rota com variável no caminho (a sondagem não sabe o id)", () => {
    const divergencia = confereEscopos(
      [{ method: "GET", path: "/users/{username}", access: "public" }],
      [],
    );
    expect(divergencia.publicasQueExigemSessao).toEqual([]);
    expect(divergencia.fechadasQueRespondem).toEqual([]);
  });

  it("só julga leitura: escrita não é sondada", () => {
    const divergencia = confereEscopos(
      [{ method: "POST", path: "/feed/posts", access: "public" }],
      [{ path: "/feed/posts", status: 401 }],
    );
    expect(divergencia.publicasQueExigemSessao).toEqual([]);
  });
});
