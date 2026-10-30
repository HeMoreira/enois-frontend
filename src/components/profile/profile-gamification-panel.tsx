import { useQuery } from "@tanstack/react-query";

import type { ProfileGamificationPanelProps } from "@/types/components/profile/profile-gamification-panel-props";
import {
  ProfileGamificationPanel as ProfileGamificationPanelView,
  StreakCard,
} from "@rede-enois/design-system/domain";

import { streakApi, walletApi } from "@/lib/api";
import { hojeNoApp } from "@/lib/date/format";
import { formatFaisca } from "@/lib/faisca";
import { STREAK_QUERY_KEY } from "@/lib/query-client";

export function ProfileGamificationPanel({
  profile,
  isOwner,
  postsCount,
}: ProfileGamificationPanelProps) {
  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => walletApi.wallet(),
    enabled: isOwner,
    staleTime: 60_000,
  });

  // A sequência é da própria pessoa: só o dono vê, ao lado da presença, e nunca fixa no
  // cabeçalho (sempre à vista ela vira cobrança diária).
  const streak = useQuery({
    queryKey: STREAK_QUERY_KEY,
    queryFn: () => streakApi.me(),
    enabled: isOwner,
    staleTime: 60_000,
  });

  return (
    <>
      <ProfileGamificationPanelView
        profile={profile}
        isOwner={isOwner}
        postsCount={postsCount}
        walletBalance={wallet ? formatFaisca(wallet.balance) : null}
        walletHref="/carteira"
      />

      {isOwner && (
        <StreakCard
          streak={streak.data}
          today={hojeNoApp()}
          loading={streak.isPending}
          error={streak.isError}
          onRetry={() => void streak.refetch()}
        />
      )}
    </>
  );
}
