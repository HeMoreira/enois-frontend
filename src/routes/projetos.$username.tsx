import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute, useMatchRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { EmptyState, LoadingState } from "@rede-enois/design-system/ui";
import { FolderKanban } from "lucide-react";

import { communityProjectsApi } from "@/lib/api";

import { AppContainer } from "@/components/app-container";

export const Route = createFileRoute("/projetos/$username")({
  head: ({ params }) => ({
    meta: [{ title: `${params.username} · ${texts.projects.seoTitle}` }],
  }),
  component: CreatorProjects,
});

/** Página do criador: precisa do Outlet para /projetos/{user}/{slug} renderizar o detalhe. */
function CreatorProjects() {
  const { username } = Route.useParams();
  const matchRoute = useMatchRoute();
  const isDetail = matchRoute({ to: "/projetos/$username/$projectSlug", fuzzy: true });

  const projects = useQuery({
    queryKey: ["projects", "user", username],
    queryFn: () => communityProjectsApi.byUser(username),
    retry: false,
  });

  if (isDetail) {
    return <Outlet />;
  }

  if (projects.isLoading) {
    return (
      <AppContainer>
        <LoadingState />
      </AppContainer>
    );
  }

  const items = projects.data ?? [];

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{username}</h1>

          <p className="text-sm text-text-subtle">{texts.projects.title}</p>
        </header>

        {items.length === 0 ? (
          <div className="surface-card">
            <EmptyState
              icon={FolderKanban}
              title={texts.projects.empty}
              description={texts.projects.emptyHint}
            />
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((project) => (
              <li key={project.id}>
                <Link
                  to="/projetos/$username/$projectSlug"
                  params={{ username, projectSlug: project.slug }}
                  className="surface-card block h-full p-4"
                >
                  <h2 className="line-clamp-2 font-semibold text-text-strong">{project.title}</h2>

                  <p className="mt-1 line-clamp-2 text-sm text-text-subtle">
                    {project.shortDescription || project.description || " "}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppContainer>
  );
}
