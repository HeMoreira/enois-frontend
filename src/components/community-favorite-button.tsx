import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { COMMUNITY_FAVORITES_KEY } from "@/constants/community-favorites";
import { CommunityFavoriteButton as CommunityFavoriteButtonView } from "@rede-enois/design-system/domain";

import { communitiesApi } from "@/lib/api";
import { useIsAuthenticated } from "@/lib/use-auth";

/** Loads and toggles the account's favorite communities for the design system star button. */
export function CommunityFavoriteButton({
  communityId,
  className,
}: {
  communityId: string;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const authenticated = useIsAuthenticated();

  const { data } = useQuery({
    queryKey: COMMUNITY_FAVORITES_KEY,
    queryFn: () => communitiesApi.favorites(),
    enabled: authenticated,
    staleTime: 30_000,
  });
  const isFavorite = (data?.items ?? []).some((c) => c.id === communityId);

  const toggle = useMutation({
    mutationFn: () =>
      isFavorite ? communitiesApi.unfavorite(communityId) : communitiesApi.favorite(communityId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COMMUNITY_FAVORITES_KEY }),
  });

  return (
    <CommunityFavoriteButtonView
      isFavorite={isFavorite}
      pending={toggle.isPending}
      onToggle={() => toggle.mutate()}
      className={className}
    />
  );
}
