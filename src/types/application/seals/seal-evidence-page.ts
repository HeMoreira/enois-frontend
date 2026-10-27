import type { SealEvidence } from "./seal-evidence";

export type SealEvidencePage = {
  items: SealEvidence[];
  total: number;
  page: number;
  size: number;
  hasMore: boolean;
};
