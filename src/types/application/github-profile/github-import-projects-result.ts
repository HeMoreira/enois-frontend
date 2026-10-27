export type GitHubImportProjectsResult = {
  created: number;
  imported: string[];
  skipped: string[];
  invalid: string[];
  limitReached: boolean;
};
