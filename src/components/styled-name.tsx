import {
  profileNameFontFamily,
  profileNameTheme,
  profileNameThemePaint,
} from "@/constants/profile-name-fonts";
import type { StyledNameProps } from "@/types/components/styled-name-props";

import { cn } from "@/lib/utils";

/**
 * Nome de uma pessoa com a personalização escolhida no perfil (tema, fonte e cor). É o MESMO
 * desenho da página de perfil, agora em todo lugar onde o nome aparece.
 */
export function StyledName({ name, style, className }: StyledNameProps) {
  if (!style) {
    return <>{name}</>;
  }

  const theme = profileNameTheme(style.theme);
  const gradient = theme.colors.length > 1;

  return (
    <span
      className={cn(theme.className, className)}
      style={{
        fontFamily: profileNameFontFamily(style.font ?? theme.font),
        ...(gradient
          ? {
              backgroundImage: profileNameThemePaint(style.theme, style.color),
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }
          : { color: style.color ?? undefined }),
      }}
    >
      {name}
    </span>
  );
}
