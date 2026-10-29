import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { EmptyState, PageHeader } from "@rede-enois/design-system/ui";
import { ArrowLeft, Bookmark } from "lucide-react";

import { savedPostsQueryOptions } from "@/lib/feed/saved-posts";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";
import { PostCard } from "@/components/post-card";

export const Route = createFileRoute("/salvos")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.saved.seoTitle }] }),
  component: SavedPosts,
});

function SavedPosts() {
  const { data: savedData } = useQuery(savedPostsQueryOptions());

  const savedPosts = savedData?.items ?? [];

  return (
    <AppContainer>
      <div className="space-y-6">
        <Link
          to="/feed"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />

          <>{texts.saved.back}</>
        </Link>

        <PageHeader
          icon={Bookmark}
          title={texts.saved.title}
          description={texts.saved.count(savedPosts.length)}
        />

        {savedPosts.length === 0 ? (
          <div className="surface-card">
            <EmptyState icon={Bookmark} title={texts.saved.empty} />
          </div>
        ) : (
          <div className="space-y-4">
            {savedPosts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </div>
    </AppContainer>
  );
}
