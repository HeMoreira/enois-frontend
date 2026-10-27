export type GitHubRepo = {
  fullName: string;
  name: string;
  description: string | null;
  url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  forks: number;
  fork: boolean;
  archived: boolean;
  updatedAt: string | null;
  defaultBranch: string;
};
