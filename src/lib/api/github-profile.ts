import type { GitHubImportProjectsResult } from "@/types/application/github-profile/github-import-projects-result";
import type { GitHubReadme } from "@/types/application/github-profile/github-readme";
import type { GitHubRepo } from "@/types/application/github-profile/github-repo";

import { api } from "../api-client";

/** Importação dos dados públicos do GitHub vinculado para o próprio perfil. */
export const githubProfileApi = {
  /** Repositórios públicos do login vinculado. */
  repos: () => api.get<GitHubRepo[]>("/me/github/repos"),

  /** README do perfil convertido para o HTML da bio (prévia, sem salvar). */
  readme: () => api.get<GitHubReadme>("/me/github/readme"),

  /** Importa os repositórios escolhidos como cards de projeto. */
  importProjects: (repos: string[]) =>
    api.post<GitHubImportProjectsResult>("/me/github/import/projects", { repos }),

  /** Salva o README do perfil como bio em HTML. */
  importReadme: () => api.post<GitHubReadme>("/me/github/import/readme", {}),
};
