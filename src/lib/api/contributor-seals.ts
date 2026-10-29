import type { ContributorContribution } from "@/types/application/seals/contributor-contribution";
import type { ContributorContributionDetail } from "@/types/application/seals/contributor-contribution-detail";
import type { ContributorContributionKind } from "@/types/application/seals/contributor-contribution-kind";
import type { ContributorContributionStatus } from "@/types/application/seals/contributor-contribution-status";
import type { ContributorRepository } from "@/types/application/seals/contributor-repository";
import type { ContributorSealType } from "@/types/application/seals/contributor-seal-type";
import type { ContributorSyncReport } from "@/types/application/seals/contributor-sync-report";
import type { ContributorSyncResult } from "@/types/application/seals/contributor-sync-result";
import type { GitHubIdentity } from "@/types/application/seals/github-identity";
import type { OpenPullRequest } from "@/types/application/seals/open-pull-request";
import type { ProfileSeal } from "@/types/application/seals/profile-seal";
import type { PullRequestReviewInput } from "@/types/application/seals/pull-request-review-input";
import type { SealCriteria } from "@/types/application/seals/seal-criteria";
import type { SealEvidencePage } from "@/types/application/seals/seal-evidence-page";

import { api, buildQuery } from "../api-client";

/** Selos de contribuição (não confundir com os selos de post em `seals.ts`). */
export const contributorSealsApi = {
  /** Níveis ativos no perfil público (só evidências validadas). */
  byUsername: (username: string) =>
    api.get<ProfileSeal[]>(`/users/${encodeURIComponent(username)}/seals`),

  /** Evidências públicas de uma categoria, em páginas (o perfil não tem teto de 12). */
  evidence: (username: string, category: string, page = 0, size = 50) =>
    api.get<SealEvidencePage>(
      `/users/${encodeURIComponent(username)}/seals/${encodeURIComponent(category)}/evidence${buildQuery({ page, size })}`,
    ),

  /** Categorias, faixas, políticas e repositórios elegíveis. */
  criteria: () => api.get<SealCriteria>("/seals/criteria"),

  /** Estado do vínculo GitHub da conta logada. */
  githubStatus: () => api.get<GitHubIdentity>("/me/github"),

  /** Revalida as contribuições do vínculo GitHub agora (botão "Verificar contribuições"). */
  sync: () => api.post<ContributorSyncResult>("/me/github/sync"),

  /** PRs abertos dos repositórios oficiais (fila de revisão do painel). */
  openPullRequests: () => api.get<OpenPullRequest[]>("/admin/github/pulls"),

  /** Aprova ou pede mudanças no PR; o GitHub registra a revisão em nome de quem está logado. */
  reviewPullRequest: (data: PullRequestReviewInput) =>
    api.post<{ id: string; status: string }>("/admin/github/pulls/review", data),

  adminContributions: (
    status?: ContributorContributionStatus,
    kind?: ContributorContributionKind,
  ) =>
    api.get<ContributorContribution[]>(
      `/admin/contributors/contributions${buildQuery({ status, kind })}`,
    ),

  adminDetail: (id: string) =>
    api.get<ContributorContributionDetail>(`/admin/contributors/contributions/${id}`),

  adminReview: (id: string, status: ContributorContributionStatus, note: string) =>
    api.post<ContributorContribution>(`/admin/contributors/contributions/${id}/review`, {
      status,
      note,
    }),

  adminRevokeSeal: (userId: string, type: ContributorSealType, reason: string) =>
    api.post<{ status: string }>(`/admin/contributors/seals/${userId}/revoke`, { type, reason }),

  adminGrantSeal: (userId: string, type: ContributorSealType, reason: string) =>
    api.post<{ status: string }>(`/admin/contributors/seals/${userId}/grant`, { type, reason }),

  adminRecalculateAll: () => api.post<{ users: number }>("/admin/contributors/recalculate", {}),

  adminSync: (data: { dryRun: boolean; full: boolean; repositories?: string[] }) =>
    api.post<ContributorSyncReport>("/admin/contributors/sync", data),

  adminRepositories: () => api.get<ContributorRepository[]>("/admin/contributors/repositories"),

  adminUpdateRepository: (repository: string, enabled: boolean) =>
    api.patch<ContributorRepository>("/admin/contributors/repositories", { repository, enabled }),
};
