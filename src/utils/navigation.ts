import type { Navigate } from "@/types/navigation/navigate";
import type { RouteDefinition } from "@/types/navigation/route-definition";

const routeDefinitions = [
  // Notificação de post (comentário/reacção/menção) leva ao post real.
  { source: "feed/posts", to: "/post/$postId", params: ["postId"] },
  // Notificação NEW_BLOG_POST vem como /blog/{slug}/{postId}; sem esta rota o clique não fazia nada.
  { source: "blog", to: "/blog/$username/$postId", params: ["username", "postId"] },
  { source: "users", to: "/perfil/$username", params: ["username"] },
  { source: "network", to: "/rede" },
  { source: "conversations", to: "/mensagens" },
  {
    source: "communities",
    to: "/comunidades/$communityId",
    params: ["communityId"],
  },
  { source: "jobs", to: "/vagas" },
  { source: "events", to: "/eventos" },
  { source: "mentors", to: "/mentoria" },
  { source: "perfil", to: "/perfil/$username", params: ["username"] },
  {
    source: "comunidades",
    to: "/comunidades/$communityId",
    params: ["communityId"],
  },
  { source: "grupos", to: "/grupos/$slug", params: ["slug"] },
  // Notificações de moderação ("Abrir painel") e de jogo ("Ver") apontam para estas rotas.
  { source: "moderador", to: "/moderador" },
  // Marketplace: o pedido de desculpa de uma comunidade banida por engano.
  { source: "marketplace", to: "/marketplace" },
  // Seguranca: novo dispositivo e 2FA redefinido. O backend manda "/seguranca" e
  // "/configuracoes/seguranca" — sem estas entradas o clique na notificacao era MUdo (a pessoa
  // tocava e nada acontecia).
  { source: "seguranca", to: "/seguranca" },
  { source: "configuracoes", to: "/seguranca" },
  { source: "suporte", to: "/suporte" },
  { source: "diretrizes", to: "/diretrizes" },
  { source: "carteira", to: "/carteira" },
  { source: "games", to: "/games/$username/$gameSlug", params: ["username", "gameSlug"] },
  { source: "feed", to: "/feed" },
  { source: "rede", to: "/rede" },
  { source: "mensagens", to: "/mensagens" },
  { source: "vagas", to: "/vagas" },
  { source: "eventos", to: "/eventos" },
  { source: "mentoria", to: "/mentoria" },
  { source: "penalidades", to: "/penalidades" },
] as const satisfies readonly RouteDefinition[];

const routes = [...routeDefinitions].sort((a, b) => b.source.length - a.source.length);

export function navigateToHref(href: string, navigate: Navigate) {
  const path = href.replace(/^\/api\//, "").replace(/^\/+|\/+$/g, "");

  // Notificação de mensagem traz o id da conversa: abre ela direto, não só a lista.
  const conversation = path.match(/^conversations\/([^/]+)$/);
  if (conversation) {
    navigate({ to: "/mensagens", search: { conversation: conversation[1] } });
    return;
  }

  const route = routes.find(({ source }) => path === source || path.startsWith(`${source}/`));

  if (!route) return;

  const values = path.slice(route.source.length).split("/").filter(Boolean);
  const paramNames = "params" in route ? route.params : [];

  if (values.length < paramNames.length) return;

  const params = Object.fromEntries(paramNames.map((name, index) => [name, values[index]]));

  navigate({
    to: route.to,
    ...(paramNames.length > 0 ? { params } : {}),
  });
}
