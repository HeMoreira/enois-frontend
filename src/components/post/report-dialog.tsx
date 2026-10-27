import { useState } from "react";

import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { ReportReason } from "@/types/application/report/report-reason";
import type { ReportTargetType } from "@/types/application/report/report-target-type";
import type { ReportDialogProps } from "@/types/components/post/report-dialog-props";

import { REPORT_REASONS, reportsApi } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

/** Título por alvo: o mesmo formulário serve para post, comentário, perfil, vaga e grupo. */
const REPORT_TITLES: Record<ReportTargetType, string> = {
  POST: texts.posts.report.title,
  COMMENT: texts.posts.report.titles.comment,
  USER: texts.posts.report.titles.profile,
  JOB: texts.jobs.report.title,
  GROUP_POST: texts.groups.reportPost,
  GROUP_COMMENT: texts.groups.reportComment,
  MESSAGE: "Denunciar mensagem",
};

/**
 * Denúncia de qualquer alvo. Quem abre manda no estado (`open`/`onOpenChange`) — o card do post
 * guarda isso no store, porque o botão de denunciar fica longe do diálogo.
 */
export function ReportDialog({ targetId, targetType, open, onOpenChange }: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason>("SPAM");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const submit = async () => {
    if (sending) return;
    setSending(true);
    try {
      await reportsApi.create({
        targetId,
        targetType,
        reason,
        description: description || undefined,
      });
      onOpenChange(false);
      setDescription("");
      toast(texts.posts.report.success, "success");
    } catch {
      toast(texts.posts.report.error, "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-normal">{REPORT_TITLES[targetType]}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-normal text-text-subtle">
              {texts.posts.report.reason}
            </Label>

            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="flex h-10 w-full rounded-md border border-border-soft bg-background px-3 py-2 text-sm font-normal text-text-strong border-transparent bg-muted"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r} className="h-10 border-transparent bg-muted">
                  {r.replace(/_/g, " ").toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-normal text-text-subtle">
              {texts.posts.report.description}
            </Label>

            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="border-border-soft bg-surface-1 text-sm font-normal h-10 border-transparent bg-muted"
            />
          </div>

          <Button className="w-full rounded-full" onClick={submit} disabled={sending}>
            {sending ? texts.posts.report.sending : texts.posts.report.action}
          </Button>

          <p className="text-center text-xs text-text-subtle">
            <Link to="/diretrizes" className="text-primary hover:underline" target="_blank">
              {texts.posts.report.guidelines}
            </Link>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
