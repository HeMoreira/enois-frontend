import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { FileUp } from "lucide-react";

import { linkedinContactsApi } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";

/** Mesmo teto do serviço (LinkedinImportService.MAX_CONTACTS_BYTES / 5 MB no ZIP). */
const CONTACTS_MAX_MB = 5;

/**
 * Contatos do LinkedIn (Connections.csv) com convite automático no Énóis.
 *
 * O LinkedIn só entrega a lista de conexões por API para apps aprovados no programa de
 * parceiros (`r_1st_connections`); o arquivo de dados é o caminho sancionado. A importação
 * casa cada contato com uma conta daqui e, com o botão ligado, manda a solicitação de
 * conexão — sem convidar quem já é conexão, quem ainda não tem conta ou quem tem nome
 * ambíguo (duas pessoas com o mesmo nome).
 */
export function LinkedinContactsSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const resumo = useQuery({
    queryKey: ["linkedin-contacts"],
    queryFn: () => linkedinContactsApi.summary(),
  });

  const atualizarResumo = () => {
    void queryClient.invalidateQueries({ queryKey: ["linkedin-contacts"] });
  };

  const toggle = useMutation({
    mutationFn: (enabled: boolean) => linkedinContactsApi.setAutoInvite(enabled),
    onSuccess: (data) => {
      queryClient.setQueryData(["linkedin-contacts"], data);
      toast(
        data.autoInvite
          ? texts.account.linkedinContacts.autoOn
          : texts.account.linkedinContacts.autoOff,
        "success",
      );
    },
    onError: (error) => toast(error.message, "error"),
  });

  const importar = useMutation({
    mutationFn: (file: File) => linkedinContactsApi.importContacts(file),
    onSuccess: (data) => {
      atualizarResumo();
      toast(texts.account.linkedinContacts.imported(data.invited, data.queued), "success");
    },
    onError: (error) => toast(error.message, "error"),
  });

  const summary = resumo.data;
  const detalhes = summary
    ? [
        summary.alreadyConnected
          ? texts.account.linkedinContacts.already(summary.alreadyConnected)
          : null,
        summary.pending ? texts.account.linkedinContacts.pending(summary.pending) : null,
        summary.queued ? texts.account.linkedinContacts.queued(summary.queued) : null,
        summary.noMatch ? texts.account.linkedinContacts.missing(summary.noMatch) : null,
        summary.ambiguous ? texts.account.linkedinContacts.ambiguous(summary.ambiguous) : null,
        summary.skipped ? texts.account.linkedinContacts.skipped(summary.skipped) : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <div className="space-y-2 border-t border-border-soft pt-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-text-strong">
            {texts.account.linkedinContacts.title}
          </p>

          <p className="text-xs font-normal text-text-subtle">
            {texts.account.linkedinContacts.hint}
          </p>
        </div>

        <Switch
          checked={summary?.autoInvite ?? false}
          disabled={!summary || toggle.isPending}
          aria-label={texts.account.linkedinContacts.autoInvite}
          onCheckedChange={(checked) => toggle.mutate(checked)}
        />
      </div>

      <p className="text-[11px] leading-relaxed text-text-subtle">
        {texts.account.linkedinContacts.autoInviteHint}
      </p>

      {resumo.isError && (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-text-subtle">{texts.account.linkedinContacts.loadError}</p>

          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={resumo.isFetching}
            onClick={() => void resumo.refetch()}
          >
            {texts.account.linkedinContacts.retry}
          </Button>
        </div>
      )}

      {summary && summary.contacts > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-text-strong">
            {texts.account.linkedinContacts.summary(summary.contacts, summary.invited)}
          </p>

          {detalhes && (
            <p className="text-[11px] leading-relaxed text-text-subtle">
              {texts.account.linkedinContacts.details(detalhes)}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border-soft px-3 py-1.5 text-xs text-text-subtle transition hover:text-text-strong">
          <FileUp className="h-3.5 w-3.5" />

          <>{texts.account.linkedinContacts.import}</>

          <input
            type="file"
            accept=".csv,.zip,text/csv,application/zip"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              if (file.size > CONTACTS_MAX_MB * 1024 * 1024) {
                toast(texts.account.linkedinContacts.tooLarge(CONTACTS_MAX_MB), "error");
                return;
              }
              importar.mutate(file);
            }}
          />
        </label>

        <a
          href="https://www.linkedin.com/psettings/member-data"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border-soft px-3 py-1.5 text-xs text-text-subtle transition hover:text-text-strong"
        >
          {texts.account.linkedinImport.getArchive}
        </a>
      </div>

      <p className="text-[11px] leading-relaxed text-text-subtle">
        {texts.account.linkedinContacts.importHint}
      </p>

      {importar.isPending && (
        <p className="text-xs text-text-subtle">{texts.account.linkedinContacts.importing}</p>
      )}
    </div>
  );
}
