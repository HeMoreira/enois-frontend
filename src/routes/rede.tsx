import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { NetworkRequestOutcome } from "@/types/lib/network/network-request-outcome";
import type { StatProps } from "@/types/routes/network/stat-props";
import type { NetworkRequest } from "@rede-enois/design-system/domain";
import { NetworkRequests, StyledName, UserAvatar } from "@rede-enois/design-system/domain";
import { Button, PageHeader } from "@rede-enois/design-system/ui";
import { Check, Send, UserMinus, UserPlus } from "lucide-react";

import { networkApi } from "@/lib/api";
import { liteInterval } from "@/lib/lite-mode";
import { networkRequests } from "@/lib/network/network-requests";
import { networkQueries } from "@/lib/query-options/network";
import { requireAuth } from "@/lib/require-auth";
import { useLiteMode } from "@/lib/use-lite-mode";

import { AppContainer } from "@/components/app-container";
import { ProfilePeek } from "@/components/profile/profile-peek";

export const Route = createFileRoute("/rede")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.network.seoTitle }] }),
  component: Rede,
});

function Rede() {
  const queryClient = useQueryClient();
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({});
  // The outcome of each answered invitation, by the other person's id. The row keeps it after the
  // refetch drops the request, so the list never jumps under the cursor.
  const [outcomes, setOutcomes] = useState<Record<string, NetworkRequestOutcome>>({});
  const lite = useLiteMode();

  const { data: usersData } = useQuery({
    queryKey: ["network", "users"],
    queryFn: () => networkApi.list(),
  });
  const { data: summary } = useQuery({
    queryKey: ["network", "summary"],
    queryFn: () => networkApi.summary(),
  });
  const requestsQuery = useQuery({
    ...networkQueries.requests(50),
    refetchInterval: liteInterval(30_000, lite),
  });

  const users = usersData?.items ?? [];
  const requests = networkRequests(requestsQuery.data?.items ?? [], outcomes);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: networkQueries.all });

  /**
   * Answers one row: progress, then its outcome or a failure, then a fresh list. A plain call and
   * not a shared `useMutation`: `mutate` callbacks only fire for the latest call, so answering two
   * invitations in a row left the first one spinning.
   */
  const respond = async (
    userId: string,
    call: (id: string) => Promise<unknown>,
    busy: NetworkRequest["status"],
    done: NetworkRequest["status"],
  ) => {
    const index = requests.findIndex((item) => item.userId === userId);
    if (index < 0) return;
    const row = requests[index];
    const mark = (status: NetworkRequest["status"]) =>
      setOutcomes((current) => ({ ...current, [userId]: { row: { ...row, status }, index } }));
    mark(busy);
    try {
      await call(userId);
      mark(done);
      void invalidate();
    } catch {
      mark("failed");
    }
  };

  const connect = useMutation({
    mutationFn: (id: string) => networkApi.connect(id),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => networkApi.remove(id),
    onSuccess: invalidate,
  });

  return (
    <AppContainer>
      <div className="space-y-6">
        <PageHeader title={texts.network.title} description={texts.network.description}>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              label={texts.network.stats.connections}
              value={String(summary?.connections ?? 0)}
            />
            <Stat label={texts.network.stats.following} value={String(summary?.followers ?? 0)} />
            <Stat
              label={texts.network.stats.requests}
              value={String(summary?.pendingRequests ?? 0)}
              highlight
            />
            <Stat label={texts.network.stats.suggestions} value={String(users.length)} />
          </div>
        </PageHeader>

        <NetworkRequests
          requests={requests}
          loading={requestsQuery.isPending}
          error={requestsQuery.isError}
          onRetry={() => requestsQuery.refetch()}
          onAccept={(userId) => respond(userId, networkApi.accept, "accepting", "accepted")}
          onDecline={(userId) => respond(userId, networkApi.remove, "declining", "declined")}
          onCancel={(userId) => respond(userId, networkApi.remove, "cancelling", "cancelled")}
        />

        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold">{texts.network.matchesTitle}</h2>

              <p className="text-sm text-muted-foreground">{texts.network.matchesDescription}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((u) => (
              <article key={u.id} className="surface-card min-w-0 overflow-hidden text-center">
                <div className="h-16" style={{ background: "var(--gradient-soft)" }} />

                <div className="-mt-10 min-w-0 px-5 pb-5">
                  <ProfilePeek username={u.username} name={u.name} className="mx-auto block">
                    <UserAvatar
                      src={u.avatar}
                      frame={u.avatarFrame}
                      alt={u.name}
                      className="mx-auto h-20 w-20 ring-4 ring-card"
                    />
                  </ProfilePeek>

                  <ProfilePeek
                    username={u.username}
                    name={u.name}
                    className="mx-auto mt-3 block max-w-full break-words text-center font-semibold hover:underline"
                  >
                    <StyledName name={u.name} style={u.nameStyle} />
                  </ProfilePeek>

                  <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-xs text-muted-foreground">
                    {u.headline}
                  </p>

                  <p className="mt-2 text-xs text-primary">
                    <Check className="mr-1 inline h-3 w-3" />

                    <>{u.connected ? texts.network.connected : texts.network.commonInterests}</>
                  </p>

                  <Button
                    className={`mt-4 w-full rounded-full gap-1.5 ${u.connected ? "text-destructive hover:text-destructive" : ""}`}
                    variant={u.connected ? "outline" : "default"}
                    disabled={connect.isPending || remove.isPending}
                    onClick={() => {
                      if (u.connected) {
                        remove.mutate(u.id);
                        setLocalStatus((s) => ({ ...s, [u.id]: "REMOVED" }));
                      } else {
                        connect.mutate(u.id);
                        setLocalStatus((s) => ({ ...s, [u.id]: "REQUESTED" }));
                      }
                    }}
                  >
                    {u.connected ? (
                      <>
                        <UserMinus className="h-4 w-4" />

                        <>{texts.network.remove}</>
                      </>
                    ) : localStatus[u.id] === "REQUESTED" ? (
                      <>
                        <Send className="h-4 w-4" />

                        <>{texts.network.requested}</>
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />

                        <>{texts.network.connect}</>
                      </>
                    )}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppContainer>
  );
}

function Stat({ label, value, highlight }: StatProps) {
  return (
    <div
      className={`rounded-xl border p-4 ${highlight ? "border-primary/30 bg-primary-soft" : "border-border bg-muted/40"}`}
    >
      <p className={`text-2xl font-semibold ${highlight ? "text-primary" : ""}`}>{value}</p>

      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
