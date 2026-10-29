import type { AuthorNameStyle } from "@/types/application/profile/author-name-style";

export type BlogSummary = {
  slug: string;
  title: string;
  description: string | null;
  authorName: string;
  authorUsername: string;
  authorAvatar: string | null;
  /** Personalização do nome do autor (tema/fonte/cor). */
  authorStyle?: AuthorNameStyle | null;
  posts: number;
};
