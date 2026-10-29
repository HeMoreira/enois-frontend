import type { AuthorNameStyle } from "@/types/application/profile/author-name-style";

/** Comentário numa publicação do grupo. */
export type GroupComment = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string | null;
  authorUsername: string | null;
  authorAvatar: string | null;
  authorAvatarFrame?: string | null;
  /** Personalização do nome do autor (tema/fonte/cor). */
  authorStyle?: AuthorNameStyle | null;
  authorBadges: string[];
  parentCommentId: string | null;
  content: string;
  createdAt: string;
};
