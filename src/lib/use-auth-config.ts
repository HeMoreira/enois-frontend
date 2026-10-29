import { useQuery } from "@tanstack/react-query";

import { authApi } from "@/lib/api";

/**
 * Configuração pública de autenticação: vem do backend para o app não depender de VITE_* no build.
 *
 * Traz o modo do captcha (e a site key do Turnstile) e quais provedores de login social estão
 * ligados no ambiente — o Google pode estar desligado, e aí o botão não pode ser oferecido.
 */
export function useAuthConfig() {
  return useQuery({
    queryKey: ["auth", "config"],
    queryFn: () => authApi.config(),
    staleTime: 5 * 60_000,
    retry: false,
  });
}
