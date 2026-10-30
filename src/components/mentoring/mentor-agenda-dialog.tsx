import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { MenteeSession } from "@/types/application/mentor/mentee-session";
import { UserAvatar } from "@rede-enois/design-system/domain";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EmptyState,
} from "@rede-enois/design-system/ui";
import { CalendarDays, MessageCircle } from "lucide-react";

import { mentorsApi, messagesApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { formatarData } from "@/lib/date/format";

const STATUS_LABELS: Record<MenteeSession["status"], string> = {
  SCHEDULED: texts.mentoring.statusScheduled,
  COMPLETED: texts.mentoring.statusCompleted,
  CANCELLED: texts.mentoring.statusCancelled,
};

const formatWhen = (value: string | null) => {
  if (!value) return texts.mentoring.noSlot;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return texts.mentoring.noSlot;
  return formatarData(date, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Agenda do mentor: quem se inscreveu, quando e o recado. O botão de mensagem abre (ou reaproveita)
 * a conversa direta com o mentorado e cai na tela de mensagens.
 */
export function MentorAgendaDialog({ mentorId }: { mentorId: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [contacting, setContacting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["mentor-sessions", mentorId],
    queryFn: () => mentorsApi.getSessions(mentorId),
    enabled: open,
  });

  const sessions = data ?? [];
  const upcoming = sessions.filter((session) => session.status === "SCHEDULED");
  const others = sessions.filter((session) => session.status !== "SCHEDULED");

  const openConversation = async (menteeId: string) => {
    setError(null);
    setContacting(menteeId);
    try {
      const conversation = await messagesApi.openDirect(menteeId);
      setOpen(false);
      navigate({ to: "/mensagens", search: { conversation: conversation.id } });
    } catch {
      setError(texts.mentoring.agendaMessageError);
    } finally {
      setContacting(null);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="shrink-0 self-center rounded-lg px-[14px] py-2">
          <CalendarDays className="mr-1.5 h-4 w-4" />
          {texts.mentoring.agendaButton}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-normal">{texts.mentoring.agendaTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {isLoading && <p className="text-sm text-text-subtle">{texts.mentoring.agendaLoading}</p>}

          {!isLoading && isError && (
            <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {texts.mentoring.agendaError}
            </p>
          )}

          {!isLoading && !isError && sessions.length === 0 && (
            <EmptyState icon={CalendarDays} title={texts.mentoring.agendaEmpty} />
          )}

          {!isLoading && !isError && sessions.length > 0 && (
            <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
              <SessionGroup
                title={texts.mentoring.agendaUpcoming}
                sessions={upcoming}
                emptyLabel={texts.mentoring.agendaNoUpcoming}
                contacting={contacting}
                onMessage={openConversation}
              />

              {others.length > 0 && (
                <SessionGroup
                  title={texts.mentoring.agendaHistory}
                  sessions={others}
                  contacting={contacting}
                  onMessage={openConversation}
                />
              )}
            </div>
          )}

          {error && (
            <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SessionGroup({
  title,
  sessions,
  emptyLabel,
  contacting,
  onMessage,
}: {
  title: string;
  sessions: MenteeSession[];
  emptyLabel?: string;
  contacting: string | null;
  onMessage: (menteeId: string) => void;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h3>

      {sessions.length === 0 ? (
        <p className="rounded-xl border border-border-soft px-3 py-3 text-sm text-text-subtle">
          {emptyLabel ?? texts.mentoring.agendaEmpty}
        </p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="space-y-2 rounded-xl border border-border-soft px-3 py-2 text-sm"
            >
              <div className="flex items-start gap-2">
                <UserAvatar
                  src={session.menteeAvatar ? resolveCdnUrl(session.menteeAvatar) : undefined}
                  alt={session.menteeName ?? texts.mentoring.menteeFallback}
                  className="h-8 w-8 shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {session.menteeName ?? texts.mentoring.menteeFallback}
                    {session.menteeUsername && (
                      <span className="ml-1 text-xs font-normal text-text-subtle">
                        @{session.menteeUsername}
                      </span>
                    )}
                  </p>

                  <p className="text-xs text-muted-foreground">{formatWhen(session.startsAt)}</p>
                </div>

                <Badge variant="secondary" className="shrink-0 rounded-full text-xs font-normal">
                  {STATUS_LABELS[session.status]}
                </Badge>
              </div>

              {session.message && (
                <p className="rounded-lg bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground">
                  {session.message}
                </p>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                disabled={contacting === session.menteeId}
                onClick={() => onMessage(session.menteeId)}
              >
                <MessageCircle className="mr-1 h-3.5 w-3.5" />
                {contacting === session.menteeId
                  ? texts.mentoring.agendaOpening
                  : texts.mentoring.agendaMessage}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
