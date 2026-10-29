import type { AuthorNameStyle } from "@/types/application/profile/author-name-style";

export type ProfileNetworkUser = {
  id: string;
  username: string;
  name: string;
  headline: string | null;
  avatar: string | null;
  avatarFrame: string | null;
  /** Personalização do nome (tema/fonte/cor). */
  nameStyle?: AuthorNameStyle | null;
};
