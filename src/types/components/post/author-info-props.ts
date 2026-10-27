import type { PostView } from "@/types/application/feed/post-view";

export type AuthorInfoProps = Pick<
  PostView,
  | "authorUsername"
  | "authorName"
  | "authorAvatar"
  | "authorAvatarFrame"
  | "authorBadge"
  | "authorStyle"
  | "authorContributor"
  | "authorBadges"
  | "authorIdentity"
  | "createdAt"
  | "community"
> & {
  fallbackClassName?: string;
  /** Chamado quando o leitor aperta "Seguir" na comunidade do post. */
  onFollowCommunity?: () => void;
  followPending?: boolean;
};
