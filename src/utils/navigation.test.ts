import { describe, expect, it, vi } from "vitest";

import { navigateToHref } from "./navigation";

function resolve(href: string) {
  const navigate = vi.fn();
  navigateToHref(href, navigate);
  return navigate;
}

describe("navigateToHref", () => {
  it("abre o painel de moderador (CTA 'Abrir painel' das notificações)", () => {
    expect(resolve("/moderador")).toHaveBeenCalledWith({ to: "/moderador" });
    expect(resolve("/moderador/")).toHaveBeenCalledWith({ to: "/moderador" });
  });

  it("resolve as demais notificações com rota própria", () => {
    expect(resolve("/suporte")).toHaveBeenCalledWith({ to: "/suporte" });
    expect(resolve("/api/diretrizes")).toHaveBeenCalledWith({ to: "/diretrizes" });
    expect(resolve("/api/carteira")).toHaveBeenCalledWith({ to: "/carteira" });
    expect(resolve("/api/penalidades")).toHaveBeenCalledWith({ to: "/penalidades" });
  });

  it("leva ao jogo específico na notificação de novo jogo", () => {
    expect(resolve("/games/kof/kawaii-survivor")).toHaveBeenCalledWith({
      to: "/games/$username/$gameSlug",
      params: { username: "kof", gameSlug: "kawaii-survivor" },
    });
  });

  it("mantém as rotas que já existiam", () => {
    expect(resolve("/feed/posts/abc")).toHaveBeenCalledWith({
      to: "/post/$postId",
      params: { postId: "abc" },
    });
    expect(resolve("/blog/kof/post-1")).toHaveBeenCalledWith({
      to: "/blog/$username/$postId",
      params: { username: "kof", postId: "post-1" },
    });
    expect(resolve("/grupos/meu-grupo")).toHaveBeenCalledWith({
      to: "/grupos/$slug",
      params: { slug: "meu-grupo" },
    });
    expect(resolve("/conversations/42")).toHaveBeenCalledWith({
      to: "/mensagens",
      search: { conversation: "42" },
    });
  });

  it("leva ao marketplace no pedido de desculpa da comunidade", () => {
    expect(resolve("/marketplace")).toHaveBeenCalledWith({ to: "/marketplace" });
  });

  it("leva a seguranca quando a sessao foi mexida (novo dispositivo, 2FA redefinido)", () => {
    // O backend manda "/seguranca" e "/configuracoes/seguranca"; sem estas entradas o clique
    // na notificacao nao levava a lugar nenhum.
    expect(resolve("/seguranca")).toHaveBeenCalledWith({ to: "/seguranca" });
    expect(resolve("/configuracoes/seguranca")).toHaveBeenCalledWith({ to: "/seguranca" });
  });

  it("nao navega para href desconhecido nem incompleto", () => {
    expect(resolve("/desconhecido")).not.toHaveBeenCalled();
    expect(resolve("/games/so-username")).not.toHaveBeenCalled();
  });
});
