import type { AuthorNameStyle } from "@/types/application/profile/author-name-style";

/** Membro do grupo, com o papel dele. */
export type GroupMember = {
  userId: string;
  username: string | null;
  name: string | null;
  avatar: string | null;
  role: "OWNER" | "ADMIN" | "MODERATOR" | "MEMBER";
  joinedAt: string;
  /** Personalização do nome (tema/fonte/cor). */
  nameStyle?: AuthorNameStyle | null;
};
