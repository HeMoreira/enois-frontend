import type { PushNavigateMessage } from "@/types/push/push-navigate-message";

/**
 * O tipo da mensagem que o service worker manda para a aba. O arquivo `public/sw.js` e JavaScript
 * puro (nao importa o app), entao a string mora nos dois lados — e o teste amarra as duas.
 */
export const PUSH_NAVIGATE = "enois:navigate";

/**
 * Extrai o href que a aba deve traduzir (pela tabela de rotas do app). Devolve `null` quando a
 * mensagem nao e de navegacao — o worker tambem manda outras coisas.
 */
export function hrefDoPush(data: PushNavigateMessage | null | undefined): string | null {
  if (data?.type !== PUSH_NAVIGATE) return null;
  if (!data.href) return null;
  return data.href;
}
