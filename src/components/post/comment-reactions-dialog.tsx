import { useEffect, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { ReactionTab } from "@/types/application/reaction/reaction-tab";
import type { CommentReactionsDialogProps } from "@/types/components/post/comment-reactions-dialog-props";
import { Smile, Users } from "lucide-react";

import { REACTION_EMOJIS, profileApi, reactionsApi } from "@/lib/api";
import { sortReactionTabsStable } from "@/lib/reactions/summary";
import { useAuth } from "@/lib/use-auth";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { UserAvatar } from "@/components/user-avatar";

/**
 * Quem reagiu a um comentário, filtrável por tipo — o mesmo diálogo que o post abre pelo
 * contador de reações. Uma query por comentário aberto, nunca por comentário da lista.
 */
export function CommentReactionsDialog({
  postId,
  commentId,
  open,
  onOpenChange,
}: CommentReactionsDialogProps) {
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const [activeTab, setActiveTab] = useState("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["comment-reactions", commentId],
    queryFn: () => reactionsApi.listCommentReactions(postId, commentId),
    enabled: open,
  });

  const reactions = data?.reactions ?? [];

  const tabsRef = useRef<ReactionTab[]>([]);
  const tabs = sortReactionTabsStable(tabsRef.current, data?.summary ?? {});
  tabsRef.current = tabs;
  const tabKey = tabs.map((tab) => tab.type).join(",");

  useEffect(() => {
    if (activeTab !== "all" && !tabs.some((tab) => tab.type === activeTab)) setActiveTab("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tabKey é a identidade estável de tabs
  }, [activeTab, tabKey]);

  const uniqueUserIds = [...new Set(reactions.map((r) => r.userId))];
  const { data: users } = useQuery({
    queryKey: ["profiles", "by-ids", uniqueUserIds.sort().join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        uniqueUserIds.map((id) => profileApi.getById(id).catch(() => null)),
      );
      return Object.fromEntries(results.filter(Boolean).map((u) => [u!.id, u!]));
    },
    enabled: open && uniqueUserIds.length > 0,
  });

  const total = reactions.length;

  const renderList = (rows: typeof reactions) => {
    if (rows.length === 0) {
      return (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Smile className="h-6 w-6 text-text-subtle" aria-hidden />

          <p className="text-sm font-normal text-text-subtle">{texts.posts.reactions.emptyType}</p>
        </div>
      );
    }

    return (
      <ul className="list-none divide-y divide-border-soft">
        {rows.map((r) => {
          const profile = users?.[r.userId];
          const mine = r.userId === currentUserId;

          return (
            <li key={`${r.userId}-${r.type}`} className="flex h-12 items-center gap-3 px-3">
              <UserAvatar
                frame={profile?.avatarFrame}
                src={profile?.avatar ?? undefined}
                alt={profile?.name}
                className="h-8 w-8 shrink-0"
              />

              <span className="min-w-0 flex-1 truncate text-sm font-normal text-text-strong">
                {profile?.name ?? texts.common.loading}
                {mine && <span className="text-text-subtle"> {texts.posts.reactions.you}</span>}
              </span>

              <span className="text-base leading-none">{REACTION_EMOJIS[r.type] ?? r.type}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-normal">{texts.posts.reactions.title}</DialogTitle>
        </DialogHeader>

        {isError ? (
          <p className="py-8 text-center text-sm font-normal text-text-subtle">
            {texts.posts.reactions.loadError}
          </p>
        ) : isLoading ? (
          <p className="py-8 text-center text-sm font-normal text-text-subtle">
            {texts.common.loading}
          </p>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="scrollbar-hide w-full justify-start overflow-x-auto">
              <TabsTrigger value="all">
                <Users className="h-3.5 w-3.5" aria-hidden />

                <>{texts.posts.reactions.all}</>

                <span className="tabular-nums">{total}</span>
              </TabsTrigger>

              {tabs.map((tab) => (
                <TabsTrigger key={tab.type} value={tab.type}>
                  <span>{REACTION_EMOJIS[tab.type] ?? tab.type}</span>

                  <span className="tabular-nums">{tab.count}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all">{renderList(reactions)}</TabsContent>

            {tabs.map((tab) => (
              <TabsContent key={tab.type} value={tab.type}>
                {renderList(reactions.filter((r) => r.type === tab.type))}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
