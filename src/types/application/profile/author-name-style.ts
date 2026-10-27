import type { ProfileNameFont } from "@/types/application/cosmetics/profile-name-font";
import type { ProfileNameTheme } from "@/types/application/cosmetics/profile-name-theme";

/**
 * Personalização do nome vinda de qualquer projeção que exibe uma pessoa (post, comentário,
 * notificação, ranking...). Os três campos são opcionais: perfil sem personalização não manda
 * estilo, e o front desenha o nome como sempre.
 */
export type AuthorNameStyle = {
  theme?: ProfileNameTheme | null;
  font?: ProfileNameFont | null;
  color?: string | null;
};
