import { useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { NotificationPreferences as Preferences } from "@/types/application/notification/notification-preferences";
import {
  type NotificationPreferenceKey,
  NotificationPreferences,
  type NotificationPreferencesSaveStatus,
} from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { notificationsApi } from "@/lib/api";
import { pushApi } from "@/lib/api/push";
import { enablePush, isPushActive, isPushSupported, pushErrorMessage } from "@/lib/push";

const PREFERENCES_KEY = ["me", "notification-preferences"] as const;

/** Push neste aparelho: ativo, e se dá para ligar daqui (navegador suporta e o servidor tem VAPID). */
function usePushState() {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    let cancelled = false;
    void (async () => {
      try {
        const config = await pushApi.config();
        const active = await isPushActive();
        if (cancelled) return;
        setEnabled(active);
        setAvailable(config.enabled && !!config.publicKey);
      } catch {
        // Sem a configuração não dá para inscrever: a nota aparece sem o botão de ligar.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      const result = await enablePush();
      if (result.ok) setEnabled(true);
      else toast(pushErrorMessage(result.reason), "error");
    } finally {
      setBusy(false);
    }
  };

  return { enabled, busy, enable: available ? () => void enable() : undefined };
}

/**
 * Preferências de notificação da conta sobre o `NotificationPreferences` do design system. Cada
 * switch salva sozinho com PUT parcial: o valor muda na hora e volta ao anterior se o servidor
 * recusar. A reversão é só da chave que falhou, para não desfazer outra que ainda está salvando.
 */
export function NotificationPreferencesPanel() {
  const queryClient = useQueryClient();
  const push = usePushState();
  const [pending, setPending] = useState<Partial<Record<NotificationPreferenceKey, boolean>>>({});
  const [lastResult, setLastResult] = useState<NotificationPreferencesSaveStatus>("idle");

  const preferences = useQuery({
    queryKey: PREFERENCES_KEY,
    queryFn: () => notificationsApi.preferences(),
  });

  const setKey = (key: NotificationPreferenceKey, value: boolean) =>
    queryClient.setQueryData<Preferences>(PREFERENCES_KEY, (current) =>
      current ? { ...current, [key]: value } : current,
    );

  const save = useMutation({
    mutationFn: ({ key, value }: { key: NotificationPreferenceKey; value: boolean }) =>
      notificationsApi.updatePreferences({ [key]: value }),
    onMutate: async ({ key, value }) => {
      await queryClient.cancelQueries({ queryKey: PREFERENCES_KEY });
      const previous = queryClient.getQueryData<Preferences>(PREFERENCES_KEY)?.[key];
      setKey(key, value);
      setPending((current) => ({ ...current, [key]: true }));
      return { previous };
    },
    onSuccess: (saved, { key }) => {
      setKey(key, saved[key]);
      setLastResult("saved");
    },
    onError: (_error, { key }, context) => {
      if (context?.previous !== undefined) setKey(key, context.previous);
      setLastResult("error");
    },
    onSettled: (_data, _error, { key }) => setPending((current) => ({ ...current, [key]: false })),
  });

  const data = preferences.data;
  const saving = Object.values(pending).some(Boolean);

  return (
    <NotificationPreferences
      values={
        data
          ? {
              weeklyDigest: data.weeklyDigest,
              pushSocial: data.pushSocial,
              pushMessages: data.pushMessages,
              pushGroups: data.pushGroups,
              pushJobs: data.pushJobs,
              pushSystem: data.pushSystem,
            }
          : null
      }
      loading={preferences.isPending}
      loadError={preferences.isError && !data}
      onRetry={() => void preferences.refetch()}
      onChange={(key, value) => save.mutate({ key, value })}
      pending={pending}
      saveStatus={saving ? "saving" : lastResult}
      pushEnabled={push.enabled}
      onEnablePush={push.enable}
      pushBusy={push.busy}
    />
  );
}
