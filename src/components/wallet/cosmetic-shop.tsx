import { useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { LojaItem } from "@/types/application/loja/loja-item";
import {
  type CosmeticShopCollection,
  type CosmeticShopItem,
  type CosmeticShopLook,
  CosmeticShop as CosmeticShopView,
} from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { lojaApi } from "@/lib/api";
import {
  DUEL_COLLECTIONS,
  cosmeticErrorMessage,
  invalidateCosmetics,
  lookPriceMf,
  profileCardData,
} from "@/lib/cosmetics";
import { useCurrentUser } from "@/lib/current-user";
import { formatFaisca } from "@/lib/faisca";

import { SaciDuelPanel } from "@/components/events/saci-duel-panel";

/** The seasonal cosmetics shop: items, collections with looks, try-on, buy and equip. */
export function CosmeticShop() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: me } = useCurrentUser();
  const catalog = useQuery({ queryKey: ["loja", "oldest"], queryFn: () => lojaApi.catalog() });
  const collections = useQuery({
    queryKey: ["loja", "colecoes"],
    queryFn: () => lojaApi.collections(),
  });

  const onSuccess = (message: string) => (): void => {
    invalidateCosmetics(queryClient);
    toast(message, "success");
  };
  const onError = (error: unknown): void => toast(cosmeticErrorMessage(error), "error");
  const buy = useMutation({
    mutationFn: (id: string) => lojaApi.buy(id),
    onSuccess: onSuccess(texts.cosmetics.bought),
    onError,
  });
  const buyLook = useMutation({
    mutationFn: (id: string) => lojaApi.buyLook(id),
    onSuccess: onSuccess(texts.cosmetics.lookBought),
    onError,
  });
  const equip = useMutation({
    mutationFn: (id: string) => lojaApi.equip(id),
    onSuccess: onSuccess(texts.cosmetics.equipped),
    onError,
  });
  const unequip = useMutation({
    mutationFn: (id: string) => lojaApi.unequip(id),
    onSuccess: onSuccess(texts.cosmetics.unequipped),
    onError,
  });

  const items = useMemo(
    (): CosmeticShopItem[] | undefined =>
      catalog.data?.map((item): CosmeticShopItem => ({
        ...item,
        priceLabel: formatFaisca(item.priceMf),
      })),
    [catalog.data],
  );
  const shopCollections = useMemo((): CosmeticShopCollection[] | undefined => {
    if (!collections.data) return undefined;
    const itemsById = new Map(
      (catalog.data ?? []).map((item): [string, LojaItem] => [item.id, item]),
    );
    return collections.data.map((collection): CosmeticShopCollection => ({
      ...collection,
      looks: collection.looks.map((look): CosmeticShopLook => ({
        ...look,
        priceLabel: formatFaisca(lookPriceMf(look, itemsById)),
      })),
    }));
  }, [catalog.data, collections.data]);

  return (
    <CosmeticShopView
      items={items}
      collections={shopCollections}
      user={me ? profileCardData(me) : { name: "" }}
      loading={catalog.isPending || collections.isPending}
      error={catalog.isError || collections.isError}
      onRetry={() => {
        void catalog.refetch();
        void collections.refetch();
      }}
      actionPending={buy.isPending || buyLook.isPending || equip.isPending || unequip.isPending}
      onBuy={(id) => buy.mutate(id)}
      onBuyLook={(id) => buyLook.mutate(id)}
      onEquip={(id) => equip.mutate(id)}
      onUnequip={(id) => unequip.mutate(id)}
      renderCollectionExtra={(id) => (DUEL_COLLECTIONS.has(id) ? <SaciDuelPanel /> : null)}
    />
  );
}
