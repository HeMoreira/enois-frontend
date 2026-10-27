import type { AuthorNameStyle } from "@/types/application/profile/author-name-style";

export type JobAuthor = {
  id: string;
  username: string | null;
  name: string;
  avatar: string | null;
  headline: string | null;
  reputation: number;
  identityVerified: boolean;
  /** Personalização do nome (tema/fonte/cor). */
  nameStyle?: AuthorNameStyle | null;
};
