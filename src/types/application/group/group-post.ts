import type { AuthorNameStyle } from "@/types/application/profile/author-name-style";

/** Publicação do feed privado do grupo (tabela própria; nunca aparece no feed principal). */
export type GroupPost = {
  id: string;
  groupId: string;
  topicId: string;
  authorId: string;
  authorName: string | null;
  authorUsername: string | null;
  authorAvatar: string | null;
  authorAvatarFrame?: string | null;
  /** Personalização do nome do autor (tema/fonte/cor). */
  authorStyle?: AuthorNameStyle | null;
  authorBadges: string[];
  content: string;
  mediaIds: string[];
  pinned: boolean;
  reactions: number;
  comments: number;
  /** Reação de quem está lendo (a tela realça o emoji escolhido). */
  myReaction: string | null;
  createdAt: string;
};
