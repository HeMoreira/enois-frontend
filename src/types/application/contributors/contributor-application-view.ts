import type { ContributorApplicationStatus } from "./contributor-application-status";

export type ContributorApplicationView = {
  id: string;
  status: ContributorApplicationStatus;
  createdAt: string;
};
