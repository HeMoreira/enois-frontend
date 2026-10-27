import type { ReactNode } from "react";

import type { AuthorNameStyle } from "@/types/application/profile/author-name-style";

export type StyledNameProps = {
  name: ReactNode;
  /** Personalização do perfil; nulo/ausente mantém o desenho padrão. */
  style?: AuthorNameStyle | null;
  className?: string;
};
