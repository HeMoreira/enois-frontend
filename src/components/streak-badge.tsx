import { useQuery } from "@tanstack/react-query";

import { StreakCard } from "@rede-enois/design-system/domain";

import { streakApi } from "@/lib/api";
import { hojeNoApp } from "@/lib/date/format";
import { STREAK_QUERY_KEY } from "@/lib/query-client";

/**
 * A sequência numa linha no cabeçalho. Só aparece com o dado na mão: carregando ou com erro, o
 * cabeçalho fica como estava (um aviso de erro ali seria ruído; a Carteira mostra o cartão inteiro).
 * Some abaixo de `sm` para não apertar o cabeçalho no celular.
 */
export function StreakBadge() {
  const { data: streak } = useQuery({
    queryKey: STREAK_QUERY_KEY,
    queryFn: () => streakApi.me(),
    staleTime: 60_000,
  });

  if (!streak) return null;

  return (
    <StreakCard
      variant="compact"
      streak={streak}
      today={hojeNoApp()}
      className="hidden sm:inline-flex"
    />
  );
}
