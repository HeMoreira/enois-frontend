/** PR aberto de um repositório oficial, na fila de revisão do painel. */
export type OpenPullRequest = {
  repository: string;
  number: number;
  title: string;
  url: string;
  authorLogin: string | null;
  authorAvatarUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};
