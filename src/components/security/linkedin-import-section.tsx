import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { LinkedinImportPreview } from "@/types/application/profile/linkedin-import-preview";
import { ClipboardPaste, FileUp } from "lucide-react";

import { preferencesApi, profileApi, projectsApi, resumeImportApi } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

import { LinkedinContactsSection } from "./linkedin-contacts-section";

/**
 * Importar o ARQUIVO DE DADOS do LinkedIn (Configurações → "Obter uma cópia dos seus
 * dados" → ZIP). O backend parseia e DEVOLVE o retrato; nada é salvo automaticamente —
 * a pessoa marca o que quer e o app cria experiencias, formação, certificações e
 * projetos pelos endpoints normais.
 */
/** Mesmo teto do serviço (LinkedinImportService.MAX_ZIP_BYTES). */
const LINKEDIN_ZIP_MAX_MB = 5;

/** Teto do perfil por seção (ProfileExtensionService.MAX_ENTRIES_PER_KIND). */
const LIMITE_POR_SECAO = 10;

/** Teto de projetos do perfil (ProjectsService.MAX_PROJECTS). */
const LIMITE_PROJETOS = 20;

/** Teto do currículo (o backend aceita PDF de até 10 MB; texto tem teto próprio). */
const RESUME_MAX_MB = 10;

/** Índice por chave da reimportação: a primeira entrada de cada chave vence. */
function indexBy<T extends { id: string }>(
  items: T[],
  keysOf: (item: T) => Array<string | null | undefined>,
): Map<string, T> {
  const index = new Map<string, T>();
  for (const item of items) {
    for (const key of keysOf(item)) {
      if (key && !index.has(key)) index.set(key, item);
    }
  }
  return index;
}

export function LinkedinImportSection({
  linkedinConectado = false,
}: {
  linkedinConectado?: boolean;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [preview, setPreview] = useState<LinkedinImportPreview | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [colando, setColando] = useState(false);
  const [texto, setTexto] = useState("");

  const aplicarPreview = (novo: LinkedinImportPreview) => {
    setPreview(novo);
    setSelected({
      ...Object.fromEntries(novo.experiences.map((_, i) => [`exp${i}`, true])),
      ...Object.fromEntries(novo.education.map((_, i) => [`edu${i}`, true])),
      ...Object.fromEntries(novo.certifications.map((_, i) => [`cert${i}`, true])),
      ...Object.fromEntries(novo.projects.map((_, i) => [`proj${i}`, true])),
      ...(novo.profile ? { perfil: true } : {}),
      ...(novo.skills?.length ? { skills: true } : {}),
    });
  };

  const importar = useMutation({
    mutationFn: (file: File) => preferencesApi.importLinkedinArchive(file),
    onSuccess: aplicarPreview,
    onError: (error) => toast(error.message, "error"),
  });

  // O caminho SEM ARQUIVO: o texto do perfil colado direto (Ctrl+A/Ctrl+C no LinkedIn).
  const importarTexto = useMutation({
    mutationFn: (colado: string) => preferencesApi.importLinkedinText(colado),
    onSuccess: (novo) => {
      aplicarPreview(novo);
      setColando(false);
    },
    onError: (error) => toast(error.message, "error"),
  });

  // O caminho VIA CURRÍCULO: a pessoa sobe o PDF (ou .txt/.md) e recebe o retrato no MESMO
  // formato do LinkedIn — a revisão e o salvamento abaixo são compartilhados, sem tela nova.
  const importarCurriculo = useMutation({
    mutationFn: (file: File) => resumeImportApi.importResume(file),
    onSuccess: aplicarPreview,
    onError: (error) => toast(error.message, "error"),
  });

  const salvar = useMutation({
    mutationFn: async () => {
      if (!preview) return { created: 0, updated: 0, truncated: false };

      // Reimportar é SINCRONIZAR: o que já está no perfil é ATUALIZADO (descrição, período,
      // local), não duplicado. Título+empresa é a chave principal; empresa (escola/emissor) +
      // data de início cobre o caso de a pessoa ter corrigido um dos nomes no LinkedIn.
      const [experiences, education, certifications, projects] = await Promise.all([
        profileApi.experiences.list(),
        profileApi.education.list(),
        profileApi.certifications.list(),
        projectsApi.mine(),
      ]);
      const normalizar = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();
      const chave = (...parts: (string | null | undefined)[]) => parts.map(normalizar).join("|");
      const comData = (nome?: string | null, data?: string | null) =>
        nome && data ? chave(nome, data) : null;

      const existentes = {
        experiences: indexBy(experiences, (item) => [
          chave(item.title, item.company),
          comData(item.company, item.startDate),
        ]),
        education: indexBy(education, (item) => [
          chave(item.school, item.degree),
          comData(item.school, item.startDate),
        ]),
        certifications: indexBy(certifications, (item) => [
          normalizar(item.name),
          comData(item.issuer, item.issueDate),
        ]),
        projects: indexBy(projects, (item) => [
          normalizar(item.title),
          item.repoUrl ? normalizar(item.repoUrl) : null,
        ]),
      };

      // Os tetos do perfil (10 por seção; 20 projetos) valem para o que é NOVO — atualizar o
      // que já existe não ocupa vaga.
      const vagas = (usados: number, teto: number) => Math.max(0, teto - usados);
      const limite = {
        experiences: vagas(experiences.length, LIMITE_POR_SECAO),
        education: vagas(education.length, LIMITE_POR_SECAO),
        certifications: vagas(certifications.length, LIMITE_POR_SECAO),
        projects: vagas(projects.length, LIMITE_PROJETOS),
      };
      let truncated = false;
      let created = 0;
      let updated = 0;

      const saves: Promise<unknown>[] = [];

      preview.experiences.forEach((exp, i) => {
        if (!selected[`exp${i}`]) return;
        const atual =
          existentes.experiences.get(chave(exp.title, exp.company)) ??
          existentes.experiences.get(comData(exp.company, exp.startDate) ?? "");
        const payload = {
          title: exp.title ?? atual?.title ?? "",
          company: exp.company ?? atual?.company ?? "",
          location: exp.location ?? atual?.location ?? null,
          description: exp.description ?? atual?.description ?? null,
          startDate: exp.startDate ?? atual?.startDate ?? null,
          // "atual" no arquivo manda: não herda um fim antigo de importação anterior.
          endDate: exp.currentlyHere ? null : (exp.endDate ?? atual?.endDate ?? null),
        };
        if (atual) {
          updated++;
          saves.push(profileApi.experiences.update(atual.id, payload));
          return;
        }
        if (limite.experiences <= 0) return void (truncated = true);
        limite.experiences--;
        created++;
        saves.push(profileApi.experiences.create(payload));
      });

      preview.education.forEach((edu, i) => {
        if (!selected[`edu${i}`]) return;
        const atual =
          existentes.education.get(chave(edu.school, edu.degree)) ??
          existentes.education.get(comData(edu.school, edu.startDate) ?? "");
        const payload = {
          school: edu.school ?? atual?.school ?? "",
          degree: edu.degree ?? atual?.degree ?? "",
          field: edu.field ?? atual?.field ?? "",
          description: edu.description ?? atual?.description ?? null,
          startDate: edu.startDate ?? atual?.startDate ?? null,
          endDate: edu.currentlyHere ? null : (edu.endDate ?? atual?.endDate ?? null),
        };
        if (atual) {
          updated++;
          saves.push(profileApi.education.update(atual.id, payload));
          return;
        }
        if (limite.education <= 0) return void (truncated = true);
        limite.education--;
        created++;
        saves.push(profileApi.education.create(payload));
      });

      preview.certifications.forEach((cert, i) => {
        if (!selected[`cert${i}`]) return;
        const atual = existentes.certifications.get(normalizar(cert.name));
        const payload = {
          name: cert.name,
          issuer: cert.issuer ?? atual?.issuer ?? "",
          description: atual?.description ?? null,
          issueDate: cert.issueDate ?? atual?.issueDate ?? null,
          expirationDate: atual?.expirationDate ?? null,
          credentialUrl: atual?.credentialUrl ?? null,
        };
        if (atual) {
          updated++;
          saves.push(profileApi.certifications.update(atual.id, payload));
          return;
        }
        if (limite.certifications <= 0) return void (truncated = true);
        limite.certifications--;
        created++;
        saves.push(profileApi.certifications.create(payload));
      });

      preview.projects.forEach((project, i) => {
        if (!selected[`proj${i}`]) return;
        const atual = existentes.projects.get(normalizar(project.title));
        // O card de projeto não tem campo de descrição: o texto do LinkedIn entra como a
        // PRIMEIRA entrada do diário. Sem descrição no arquivo, o diário existente fica como está.
        const diary = project.description
          ? [
              {
                date: project.startDate ?? new Date().toISOString().slice(0, 10),
                text: project.description.slice(0, 2_000),
              },
            ]
          : undefined;
        const payload = {
          title: project.title ?? atual?.title ?? "",
          description: project.description?.slice(0, 500) ?? atual?.description ?? null,
          stack: atual?.stack ?? [],
          repoUrl: project.url ?? atual?.repoUrl ?? null,
          status: atual?.status ?? null,
          diary: diary ?? atual?.diary ?? [],
          html: atual?.html ?? null,
        };
        if (atual) {
          updated++;
          saves.push(projectsApi.update(atual.id, payload));
          return;
        }
        if (limite.projects <= 0) return void (truncated = true);
        limite.projects--;
        created++;
        saves.push(projectsApi.create(payload));
      });

      // Perfil: os campos do Profile.csv e as skills entram num update único (parcial).
      if (preview.profile && selected.perfil) {
        const campos: Record<string, unknown> = {};
        if (preview.profile.headline) campos.headline = preview.profile.headline;
        if (preview.profile.location) campos.location = preview.profile.location;
        if (preview.profile.summary) campos.bio = preview.profile.summary.slice(0, 2_000);
        if (Object.keys(campos).length > 0) {
          saves.push(profileApi.update(campos));
        }
      }
      if (preview.skills?.length && selected.skills) {
        saves.push(profileApi.update({ skills: preview.skills.slice(0, 50) }));
      }
      await Promise.all(saves);
      return { created, updated, truncated };
    },
    onSuccess: ({ created, updated, truncated }) => {
      if (created === 0 && updated === 0) {
        toast(texts.account.linkedinImport.nothingNew, "success");
      } else {
        toast(
          texts.account.linkedinImport.done(created, updated) +
            (truncated ? ` ${texts.account.linkedinImport.capReached}` : ""),
          "success",
        );
      }
      setPreview(null);
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: ["experiences"] });
    },
    onError: (error) => toast(error.message, "error"),
  });

  const toggle = (key: string) => setSelected((current) => ({ ...current, [key]: !current[key] }));

  const linhas = preview
    ? [
        ...(preview.profile
          ? [
              {
                key: "perfil",
                label:
                  `Perfil: ${preview.profile.headline ?? "—"}` +
                  (preview.profile.location ? ` · ${preview.profile.location}` : "") +
                  (preview.profile.summary ? " · com o seu resumo" : ""),
              },
            ]
          : []),
        ...(preview.skills?.length
          ? [
              {
                key: "skills",
                label: `Habilidades: ${preview.skills.slice(0, 8).join(", ")}${preview.skills.length > 8 ? "…" : ""}`,
              },
            ]
          : []),
        ...preview.experiences.map((exp, i) => ({
          key: `exp${i}`,
          label: `${exp.title ?? ""} — ${exp.company ?? ""}`,
        })),
        ...preview.education.map((edu, i) => ({
          key: `edu${i}`,
          label: `${edu.school} — ${edu.degree || edu.field || ""}`,
        })),
        ...preview.certifications.map((cert, i) => ({ key: `cert${i}`, label: cert.name })),
        ...preview.projects.map((project, i) => ({ key: `proj${i}`, label: project.title })),
      ]
    : [];

  return (
    <div className="space-y-2 border-t border-border-soft pt-3">
      <p className="text-xs font-medium text-text-strong">{texts.account.linkedinImport.title}</p>

      <p className="text-xs font-normal text-text-subtle">
        {linkedinConectado
          ? texts.account.linkedinImport.hint
          : texts.account.linkedinImport.connectFirst}
      </p>

      {!preview && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={colando ? "default" : "outline"}
              className="rounded-full gap-1.5"
              onClick={() => setColando((atual) => !atual)}
            >
              <ClipboardPaste className="h-3.5 w-3.5" />

              <>{texts.account.linkedinImport.pasteToggle}</>
            </Button>

            <a
              href="https://www.linkedin.com/psettings/member-data"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border-soft px-3 py-1.5 text-xs text-text-subtle transition hover:text-text-strong"
            >
              {texts.account.linkedinImport.getArchive}
            </a>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border-soft px-3 py-1.5 text-xs text-text-subtle transition hover:text-text-strong">
              {texts.account.linkedinImport.button}
              <input
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  // Mesmo teto do serviço (5 MB): avisar antes poupa o envio inteiro de um arquivo
                  // que seria recusado — e explica qual exportação usar.
                  if (file.size > LINKEDIN_ZIP_MAX_MB * 1024 * 1024) {
                    toast(texts.account.linkedinImport.tooLarge(LINKEDIN_ZIP_MAX_MB), "error");
                    return;
                  }
                  importar.mutate(file);
                }}
              />
            </label>

            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border-soft px-3 py-1.5 text-xs text-text-subtle transition hover:text-text-strong">
              <FileUp className="h-3.5 w-3.5" />

              <>{texts.account.linkedinImport.resumeButton}</>

              <input
                type="file"
                accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  // Mesmo teto do serviço (10 MB): o backend recusa com FILE_TOO_LARGE, mas
                  // avisar antes poupa o envio inteiro — e o DOC/DOCX avisa na hora que precisa
                  // sair em PDF (o accept acima já filtra, mas nem todo navegador respeita).
                  const name = file.name.toLowerCase();
                  if (/\.(doc|docx)$/.test(name)) {
                    toast(
                      "Esse formato não entra: exporte o currículo em PDF no seu editor (Arquivo → Exportar como PDF).",
                      "error",
                    );
                    return;
                  }
                  if (file.size > RESUME_MAX_MB * 1024 * 1024) {
                    toast(
                      "Arquivo grande demais: o currículo vai até 10 MB (PDF de até 20 páginas) ou 512 KB em texto.",
                      "error",
                    );
                    return;
                  }
                  importarCurriculo.mutate(file);
                }}
              />
            </label>
          </div>

          <p className="text-[11px] leading-relaxed text-text-subtle">
            {texts.account.linkedinImport.resumeHint}
          </p>

          {colando && (
            <div className="space-y-2">
              <Textarea
                value={texto}
                onChange={(event) => setTexto(event.target.value)}
                placeholder={texts.account.linkedinImport.pastePlaceholder}
                className="min-h-32 text-xs"
                maxLength={120_000}
              />

              <Button
                size="sm"
                className="rounded-full"
                disabled={!texto.trim() || importarTexto.isPending}
                onClick={() => importarTexto.mutate(texto)}
              >
                {texts.account.linkedinImport.pasteRead}
              </Button>
            </div>
          )}
        </div>
      )}

      {importar.isPending && <p className="text-xs text-text-subtle">{texts.common.loading}</p>}

      {importarCurriculo.isPending && (
        <p className="text-xs text-text-subtle">Lendo o currículo...</p>
      )}

      {preview && (
        <div className="space-y-2">
          <p className="text-xs font-normal text-text-subtle">
            {texts.account.linkedinImport.found(preview.found)}
          </p>

          {Object.keys(preview.semEstrutura ?? {}).length > 0 && (
            <p className="text-[11px] leading-relaxed text-text-subtle">
              {texts.account.linkedinImport.semEstrutura(
                Object.entries(preview.semEstrutura)
                  .map(([rotulo, n]) => `${n} ${rotulo.toLowerCase()}`)
                  .join(", "),
              )}
            </p>
          )}

          <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg bg-surface-1 p-2">
            {linhas.map((linha) => (
              <label key={linha.key} className="flex items-center gap-2 text-xs text-text-strong">
                <input
                  type="checkbox"
                  checked={selected[linha.key] ?? false}
                  onChange={() => toggle(linha.key)}
                />

                <span className="truncate">{linha.label}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="rounded-full"
              disabled={salvar.isPending}
              onClick={() => salvar.mutate()}
            >
              {texts.account.linkedinImport.save}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="rounded-full"
              onClick={() => setPreview(null)}
            >
              {texts.common.cancel}
            </Button>
          </div>
        </div>
      )}

      {/* Contatos: o mesmo arquivo de dados traz o Connections.csv, e daí sai o convite
          automático para quem já tem conta no Énóis. Só faz sentido com o LinkedIn vinculado. */}
      {linkedinConectado && <LinkedinContactsSection />}
    </div>
  );
}
