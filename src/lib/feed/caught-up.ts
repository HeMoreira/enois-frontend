import { useCallback, useEffect, useRef } from "react";

import type { PostView } from "@/types/application/feed/post-view";

import { feedApi } from "@/lib/api";

const time = (iso: string) => new Date(iso).getTime();

/**
 * Onde entra o divisor "Você está em dia": antes do primeiro post com `createdAt` até o
 * `lastSeenAt`. Só quando há marcador e pelo menos um post mais novo acima (divisor no topo não diz
 * nada). -1 quando não entra (ainda não chegou a página com posts antigos, por exemplo).
 */
export function caughtUpIndex(posts: Pick<PostView, "createdAt">[], lastSeenAt: string | null) {
  if (!lastSeenAt) return -1;
  const seen = time(lastSeenAt);
  const index = posts.findIndex((post) => time(post.createdAt) <= seen);
  return index > 0 ? index : -1;
}

/** O `createdAt` mais novo da lista (o feed "Para você" não é cronológico, então não é o primeiro). */
export function newestCreatedAt(posts: Pick<PostView, "createdAt">[]): string | null {
  return posts.reduce<string | null>(
    (newest, post) =>
      newest === null || time(post.createdAt) > time(newest) ? post.createdAt : newest,
    null,
  );
}

/**
 * Marca o feed como visto UMA vez por visita, quando o primeiro post sai pelo topo da tela (a
 * pessoa rolou além dele). Devolve o ref para o invólucro do primeiro post.
 */
export function useMarkFeedSeen(posts: Pick<PostView, "createdAt">[]) {
  const sent = useRef(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const newest = useRef<string | null>(null);

  useEffect(() => {
    newest.current = newestCreatedAt(posts);
  }, [posts]);

  useEffect(() => () => observer.current?.disconnect(), []);

  return useCallback((element: HTMLElement | null) => {
    observer.current?.disconnect();
    if (!element || sent.current || typeof IntersectionObserver === "undefined") return;
    observer.current = new IntersectionObserver(([entry]) => {
      if (sent.current || entry.isIntersecting || entry.boundingClientRect.bottom > 0) return;
      const seenUntil = newest.current;
      if (!seenUntil) return;
      sent.current = true;
      observer.current?.disconnect();
      // Falhar aqui só adia o marcador para a próxima visita; não há nada para a pessoa fazer.
      feedApi.markSeen(seenUntil).catch(() => undefined);
    });
    observer.current.observe(element);
  }, []);
}
