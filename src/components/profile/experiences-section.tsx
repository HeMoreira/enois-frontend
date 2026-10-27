import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { Experience } from "@/types/application/profile/experience";
import { Briefcase, MapPin } from "lucide-react";

import { profileApi } from "@/lib/api";
import { mesAno, partesDaData } from "@/lib/date/format";

/** "jan. de 2023" → "jan. 2023" (o LinkedIn mostra assim, sem o "de"). */
const monthYear = (iso: string) => mesAno(iso).replace(" de ", " ");

/** Meses inclusivos entre início e fim (mês de entrada conta), como no LinkedIn. */
function monthsBetween(start: string, end: string | null): number {
  // Ano e mês lidos no fuso do app: `getMonth()` usa o fuso do runtime e o servidor (UTC) e o
  // navegador contariam meses diferentes na virada do mês — o HTML do servidor pararia de bater
  // com o do cliente.
  const from = partesDaData(start);
  const to = partesDaData(end ?? new Date());
  if (!from || !to) return 1;
  const months = (to.ano - from.ano) * 12 + (to.mes - from.mes) + 1;
  return Math.max(1, months);
}

function durationLabel(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "ano" : "anos"}`);
  if (rest > 0) parts.push(`${rest} ${rest === 1 ? "mês" : "meses"}`);
  return parts.join(" e ") || "1 mês";
}

function ExperienceItem({ item }: { item: Experience }) {
  const period = item.startDate
    ? `${monthYear(item.startDate)} – ${
        item.currentlyHere || !item.endDate
          ? texts.profile.experiences.present
          : monthYear(item.endDate)
      }`
    : item.currentlyHere || !item.endDate
      ? texts.profile.experiences.present
      : null;
  const duration = item.startDate
    ? durationLabel(monthsBetween(item.startDate, item.endDate))
    : null;

  return (
    <li className="flex gap-3 border-t border-border-soft pt-4 first:border-t-0 first:pt-0">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-primary">
        <Briefcase className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="break-words font-medium text-text-strong">{item.title}</h3>

        <p className="break-words text-sm text-text-subtle">
          {item.company}
          {item.location ? (
            <>
              {" · "}
              <span className="inline-flex items-center gap-1">
                <MapPin className="inline h-3 w-3" />
                {item.location}
              </span>
            </>
          ) : null}
        </p>

        {(period || duration) && (
          <p className="mt-0.5 text-xs text-text-subtle">
            {[period, duration].filter(Boolean).join(" · ")}
          </p>
        )}

        {item.description && (
          <p className="mt-2 whitespace-pre-line break-words text-sm text-text-subtle">
            {item.description}
          </p>
        )}
      </div>
    </li>
  );
}

/**
 * Trajetória profissional abaixo dos projetos: cargo, empresa, local, período (com "atual" para
 * quem está lá) e a descrição de cada posição — o que o LinkedIn mostra, no perfil do Énóis.
 */
export function ProfileExperiencesSection({ username }: { username: string }) {
  const { data: experiences = [] } = useQuery({
    queryKey: ["experiences", username],
    queryFn: () => profileApi.experiences.byUser(username),
  });

  const sorted = [...experiences].sort((a, b) => {
    if (a.currentlyHere !== b.currentlyHere) return a.currentlyHere ? -1 : 1;
    const da = a.startDate ?? "";
    const db = b.startDate ?? "";
    return da > db ? -1 : da < db ? 1 : 0;
  });

  if (sorted.length === 0) return null;

  return (
    <section className="border border-border-soft bg-surface-card">
      <div className="px-4 pb-3 pt-4 sm:px-6 sm:pt-6">
        <h2 className="text-base font-normal text-text-strong">
          {texts.profile.experiences.title}
        </h2>
      </div>

      <ul className="space-y-4 px-4 pb-5 sm:px-6">
        {sorted.map((item) => (
          <ExperienceItem key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}
