import type { ProfileNameFont } from "@/types/application/cosmetics/profile-name-font";
import type { ProfileNameTheme } from "@/types/application/cosmetics/profile-name-theme";

export type AppearanceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileName?: string;
  profileNameFont?: ProfileNameFont;
  profileNameColor?: string | null;
  profileNameTheme?: ProfileNameTheme;
  /** Só quem tem contribuição verificada vê a opção da tag. */
  contributor?: boolean;
  contributorTagColor?: string | null;
};
