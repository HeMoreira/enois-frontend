import { useMutation, useQuery } from "@tanstack/react-query";

import { usePreferencesStore } from "@/stores/preferences.store";
import { texts } from "@/texts";
import { Loader2, Store } from "lucide-react";

import { marketplaceApi, themesApi } from "@/lib/api";
import { registerGalleryCollection } from "@/lib/theme/gallery-collections";
import { useIsAuthenticated } from "@/lib/use-auth";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/**
 * Temas que a pessoa comprou na loja. O conteúdo comprado é aberto pelo backend (só o comprador),
 * registrado na coleção local e aplicado como qualquer tema da galeria.
 */
export function PurchasedThemes() {
  const authenticated = useIsAuthenticated();
  const setThemeCollection = usePreferencesStore((state) => state.setThemeCollection);
  const { toast } = useToast();

  const { data } = useQuery({
    queryKey: ["marketplace", "purchases", "themes"],
    queryFn: () => marketplaceApi.purchases(),
    enabled: authenticated,
    retry: false,
  });

  const apply = useMutation({
    mutationFn: (itemId: string) => themesApi.get(itemId),
    onSuccess: (theme) => {
      const collection = registerGalleryCollection({
        id: theme.id,
        name: theme.name,
        description: "",
        packageJson: theme.packageJson,
        modeDefault: theme.modeDefault,
      });
      setThemeCollection(collection.id);
      toast(texts.appearance.purchasedThemeApplied, "success");
    },
    onError: () => toast(texts.appearance.purchasedThemeError, "error"),
  });

  if (!authenticated) return null;

  const themes = (data ?? []).filter(
    (purchase) => purchase.itemKind === "THEME" && purchase.itemId && purchase.state !== "REFUNDED",
  );
  const unique = [...new Map(themes.map((purchase) => [purchase.itemId, purchase])).values()];

  return (
    <section className="space-y-2 border-t border-border-soft pt-3">
      <div className="space-y-0.5">
        <h3 className="text-xs font-medium text-text-strong">
          {texts.appearance.purchasedThemesTitle}
        </h3>

        <p className="text-xs font-normal text-text-subtle">
          {texts.appearance.purchasedThemesHint}
        </p>
      </div>

      {unique.length === 0 ? (
        <p className="text-xs text-text-subtle">{texts.appearance.purchasedThemesEmpty}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {unique.map((purchase) => (
            <li key={purchase.id}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-auto rounded-full gap-1.5 text-xs"
                disabled={apply.isPending}
                onClick={() => apply.mutate(purchase.itemId!)}
              >
                {apply.isPending && apply.variables === purchase.itemId ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Store className="h-3.5 w-3.5" />
                )}

                <>{purchase.title ?? texts.appearance.purchasedThemeApply}</>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
