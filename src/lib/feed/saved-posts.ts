import { type QueryClient, queryOptions } from "@tanstack/react-query";

import type { PageResponse } from "@/types/application/api/page-response";
import type { PostView } from "@/types/application/feed/post-view";
import type { ActionResponse } from "@/types/application/reaction/action-response";

import { feedApi } from "@/lib/api";

/**
 * `/salvos` e o botão de salvar leem esta mesma consulta. O app a trata como
 * fresca por 30s (`router.tsx`), então a mutação precisa escrever aqui: esperar
 * expirar deixa a tela e os outros cards com a coleção anterior.
 *
 * Sem coleção carregada devolvemos `undefined` de propósito. O `setQueryData`
 * não cria a query nesse caso — uma lista de um post só esconderia o resto
 * até o próximo refetch.
 * https://tanstack.com/query/v5/docs/reference/QueryClient#queryclientsetquerydata
 */
const SAVED_POSTS_STALE_MS = 30_000;

export function savedPostsQueryOptions() {
  return queryOptions({
    queryKey: ["saved-posts"] as const,
    queryFn: () => feedApi.listSaved(),
    staleTime: SAVED_POSTS_STALE_MS,
  });
}

const SAVED_STATUSES = new Set(["SAVED", "ALREADY_SAVED"]);
const UNSAVED_STATUSES = new Set(["SAVE_REMOVED", "SAVE_NOT_FOUND"]);

/** `null` quando o status não decide o botão — a tela não deve inverter no escuro. */
export function savedStateFromAction(status: string): boolean | null {
  if (SAVED_STATUSES.has(status)) return true;
  if (UNSAVED_STATUSES.has(status)) return false;
  return null;
}

export function applySaveToSavedFeed(
  current: PageResponse<PostView> | undefined,
  post: PostView,
  result: ActionResponse,
): PageResponse<PostView> | undefined {
  if (!current || post.id !== result.postId) return current;
  if (!SAVED_STATUSES.has(result.status) && !UNSAVED_STATUSES.has(result.status)) return current;

  const index = current.items.findIndex((item) => item.id === result.postId);

  if (UNSAVED_STATUSES.has(result.status)) {
    if (index < 0) return current;
    return { ...current, items: current.items.filter((item) => item.id !== result.postId) };
  }

  if (index >= 0) {
    const items = current.items.slice();
    items[index] = { ...current.items[index], counters: result.counters };
    return { ...current, items };
  }

  // O backend lista por createdAt desc. Save novo é o mais recente e vai na frente.
  // ALREADY_SAVED ausente do cache não traz a data original; a frente evita que
  // /salvos esconda o post até os 30s de frescor acabarem.
  return { ...current, items: [{ ...post, counters: result.counters }, ...current.items] };
}

export function syncSavedPostsCache(
  queryClient: QueryClient,
  post: PostView,
  result: ActionResponse,
) {
  queryClient.setQueryData(savedPostsQueryOptions().queryKey, (current) =>
    applySaveToSavedFeed(current, post, result),
  );
}
