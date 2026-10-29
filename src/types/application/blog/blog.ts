import type { AuthorNameStyle } from "@/types/application/profile/author-name-style";

import type { BlogPost } from "./blog-post";

export type Blog = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  /** Tema em HTML/CSS sanitizado; nulo = cabeçalho padrão. */
  themeHtml: string | null;
  authorName: string;
  authorUsername: string;
  authorAvatar: string | null;
  authorBadge: string | null;
  /** Personalização do nome do autor (tema/fonte/cor). */
  authorStyle?: AuthorNameStyle | null;
  /** Todos os emblemas do autor (até 5), junto ao nome no cabeçalho. */
  authorBadges?: string[] | null;
  posts: number;
  /** Se quem está lendo já segue o blog (false sem sessão). */
  subscribed: boolean;
  /** Se o blog é de quem está lendo. */
  owner: boolean;
  items: BlogPost[];
};
