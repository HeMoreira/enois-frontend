import { useRef } from "react";

import { REACTION_EMOJIS } from "@/constants/reaction-emojis";
import { texts } from "@/texts";
import type { ReactionTab } from "@/types/application/reaction/reaction-tab";
import type { CommentReactionsSummaryProps } from "@/types/components/post/comment-reactions-summary-props";

import { sortReactionTabsStable } from "@/lib/reactions/summary";
import { cn } from "@/lib/utils";

/**
 * Pílulas de reação do comentário (emoji + contagem), iguais às do post.
 *
 * Clicar alterna a reação: a minha fica destacada em roxo; clicar nela remove, clicar em outra
 * troca. O estado otimista vive no `CommentItem`, dono da reação e do resumo.
 */
export function CommentReactionsSummary({ summary, mine, onToggle }: CommentReactionsSummaryProps) {
  // A ordem fica no ref: o resumo é otimista, então reordenar a cada clique moveria a pílula no
  // meio do toque. Só a entrada de um tipo novo (ou o primeiro load) reordena por contagem.
  const tabsRef = useRef<ReactionTab[]>([]);
  const tabs = sortReactionTabsStable(tabsRef.current, summary);
  tabsRef.current = tabs;

  if (tabs.length === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1 px-3">
      {tabs.map(({ type, count }) => {
        const active = mine === type;
        const emoji = REACTION_EMOJIS[type] ?? type;

        return (
          <button
            key={type}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(type)}
            title={
              active
                ? texts.posts.reactions.removeWith(emoji)
                : texts.posts.reactions.reactWith(emoji)
            }
            aria-label={
              active
                ? texts.posts.reactions.removeWith(emoji)
                : texts.posts.reactions.reactWith(emoji)
            }
            className={cn(
              "relative inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full border px-2 text-[11px] leading-none transition-colors before:absolute before:-inset-y-2 before:-inset-x-1 before:content-['']",
              active
                ? "border-[#8b5cf6]/40 bg-[#8b5cf6]/15 text-[#c4b5fd] hover:bg-[#8b5cf6]/25"
                : "border-white/10 bg-white/[0.06] text-text-subtle hover:bg-white/10",
            )}
          >
            <span
              className={cn(
                "inline-flex h-3.5 items-center justify-center text-sm leading-none",
                !active && "grayscale-[0.3] opacity-80",
              )}
            >
              {emoji}
            </span>

            <span className="tabular-nums leading-none">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
