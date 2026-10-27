import { texts } from "@/texts";
import type { ContributorTagProps } from "@/types/components/contributor-tag-props";

import { cn } from "@/lib/utils";

/** Pill "Contribuinte" com a cor escolhida no perfil; o mesmo desenho no perfil e no feed. */
export function ContributorTag({ color, className }: ContributorTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        className,
      )}
      style={{
        color: color ?? "var(--primary)",
        borderColor: color ?? "var(--primary)",
      }}
    >
      {texts.profile.contributorTag}
    </span>
  );
}
