/** Revisão enviada ao GitHub pelo painel: aprovar ou pedir mudanças. */
export type PullRequestReviewInput = {
  repository: string;
  number: number;
  decision: "APPROVE" | "REQUEST_CHANGES";
  comment?: string;
};
