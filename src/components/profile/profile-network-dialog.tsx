import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { ProfileNetworkUser } from "@/types/application/profile/profile-network-user";
import type { ProfileNetworkDialogProps } from "@/types/components/profile/profile-network-dialog-props";

import { profileApi } from "@/lib/api";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { StyledName } from "@/components/styled-name";
import { UserAvatar } from "@/components/user-avatar";

export function ProfileNetworkDialog({
  username,
  name,
  kind,
  open,
  onOpenChange,
}: ProfileNetworkDialogProps) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["profile-network", username, kind],
    queryFn: () => profileApi.network(username, kind),
    enabled: open,
  });

  const title =
    kind === "connections"
      ? texts.profile.dashboard.networkDialog.connectionsTitle(name)
      : texts.profile.dashboard.networkDialog.followersTitle(name);
  const emptyMessage =
    kind === "connections"
      ? texts.profile.dashboard.networkDialog.emptyConnections
      : texts.profile.dashboard.networkDialog.emptyFollowers;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-normal">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {isPending && (
            <p className="py-6 text-center text-sm text-text-subtle">{texts.common.loading}</p>
          )}

          {isError && (
            <p className="py-6 text-center text-sm text-text-subtle">
              {texts.profile.dashboard.networkDialog.error}
            </p>
          )}

          {!isPending && !isError && data?.length === 0 && (
            <p className="py-6 text-center text-sm text-text-subtle">{emptyMessage}</p>
          )}

          {!isPending &&
            !isError &&
            data?.map((person: ProfileNetworkUser) => (
              <Link
                key={person.id}
                to="/perfil/$username"
                params={{ username: person.username }}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 rounded-xl border border-border-soft bg-surface-1 px-3 py-3 transition hover:border-primary/40 hover:bg-primary/5"
              >
                <UserAvatar
                  src={person.avatar}
                  alt={person.name}
                  frame={person.avatarFrame}
                  className="h-10 w-10 shrink-0"
                />

                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-text-strong">
                    <StyledName name={person.name} style={person.nameStyle} />
                  </span>

                  <span className="block truncate text-xs text-text-subtle">
                    @{person.username}
                    {person.headline ? ` · ${person.headline}` : ""}
                  </span>
                </span>
              </Link>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
