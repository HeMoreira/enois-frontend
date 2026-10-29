import type { AuthorNameStyle } from "@/types/application/profile/author-name-style";

export type Notification = {
  id: string;
  kind: string;
  actorId: string | null;
  actorName: string | null;
  /** Username do ator — clique no nome/foto abre o perfil dele. */
  actorUsername: string | null;
  actorAvatar: string | null;
  /** Personalização do nome do ator (tema/fonte/cor); ausente = padrão. */
  actorStyle?: AuthorNameStyle | null;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href: string;
  ctaLabel: string;
};
