import type { QueryClient } from "@tanstack/react-query";

import type { PostView } from "@/types/application/feed/post-view";
import type { FeedPages } from "@/types/lib/feed/feed-pages";

export function updatePostInQueryCache(
  queryClient: QueryClient,
  postId: string,
  update: (post: PostView) => PostView,
) {
  // O prefixo `["feed"]` alcança também as consultas vizinhas que não são páginas de feed
  // (`["feed","scheduled"]` guarda uma lista simples). Sem esta checagem, `pages` vinha
  // indefinido e o `.map` estourava DENTRO da atualização otimista — o efeito era a ação
  // morrer antes de falar com o servidor. Só mexe em quem realmente tem páginas.
  queryClient.setQueriesData<FeedPages>({ queryKey: ["feed"] }, (current) => {
    if (!current || !Array.isArray(current.pages)) return current;
    return {
      ...current,
      pages: current.pages.map((page) => ({
        ...page,
        items: page.items.map((post) => (post.id === postId ? update(post) : post)),
      })),
    };
  });

  queryClient.setQueryData<PostView>(["post", postId], (post) =>
    post && post.id === postId ? update(post) : post,
  );
}
