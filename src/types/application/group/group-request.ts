import type { AuthorNameStyle } from "@/types/application/profile/author-name-style";

/** Pedido de ingresso pendente (só quem administra vê). */
export type GroupRequest = {
  id: string;
  userId: string;
  username: string | null;
  name: string | null;
  avatar: string | null;
  message: string | null;
  createdAt: string;
  /** Personalização do nome (tema/fonte/cor). */
  nameStyle?: AuthorNameStyle | null;
};
