import { useEffect, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { UserProject } from "@/types/application/project/user-project";
import type { UserProjectInput } from "@/types/application/project/user-project-input";
import type { ProjectCardMode } from "@/types/components/profile/project-card-mode";
import type { ProjectsManagerProps } from "@/types/components/profile/projects-manager-props";
import type { EditingProject } from "@/types/components/profile/projects-manager-state";

import { projectsApi } from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

import { HtmlEditor } from "@/components/html-editor";

const STATUS_PRESETS = ["ideia", "em andamento", "pausado", "concluído"] as const;

const vazio = (): UserProjectInput => ({
  title: "",
  description: "",
  stack: [],
  repoUrl: null,
  status: "em andamento",
  diary: [],
  html: null,
});

/**
 * Gerenciador de projetos (dono do perfil): lista + editor, com a dualidade da
 * casa — preencher o formulário estruturado OU escrever o HTML do card (que o
 * backend sanitiza e o quadro isolado renderiza, como a bio e a capa).
 */
export function ProjectsManager({ open, onOpenChange, username, onSaved }: ProjectsManagerProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", "mine"],
    queryFn: () => projectsApi.mine(),
    enabled: open,
  });

  const [editando, setEditando] = useState<EditingProject>(null);
  const [modo, setModo] = useState<ProjectCardMode>("estruturado");
  const [stackTexto, setStackTexto] = useState("");

  useEffect(() => {
    if (editando) {
      setStackTexto(editando.stack.join(", "));
      setModo(editando.html ? "html" : "estruturado");
    }
  }, [editando]);

  const salvar = useMutation({
    mutationFn: async () => {
      if (!editando) return null;
      const input: UserProjectInput = {
        title: editando.title.trim(),
        description: editando.description?.trim() || null,
        stack: stackTexto
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        repoUrl: editando.repoUrl?.trim() || null,
        status: modo === "estruturado" ? editando.status?.trim() || null : null,
        diary: modo === "estruturado" ? editando.diary : [],
        html: modo === "html" ? editando.html?.trim() || null : null,
      };
      return editando.id ? projectsApi.update(editando.id, input) : projectsApi.create(input);
    },
    onSuccess: () => {
      toast(texts.profile.projects.saved);
      setEditando(null);
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      onSaved();
    },
    onError: (error) => {
      toast(
        error instanceof Error && error.message.includes("20")
          ? error.message
          : texts.profile.projects.error,
        "error",
      );
    },
  });

  const excluir = useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      onSaved();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-normal">{texts.profile.projects.title}</DialogTitle>

          <DialogDescription>{texts.profile.projects.hint}</DialogDescription>
        </DialogHeader>

        {!editando && (
          <div className="space-y-3 pt-2">
            {projects.length === 0 && (
              <p className="py-4 text-center text-sm text-text-subtle">
                {texts.profile.projects.empty}
              </p>
            )}

            {projects.map((project: UserProject) => (
              <div
                key={project.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-surface-1 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-strong">{project.title}</p>

                  <p className="truncate text-xs text-text-subtle">
                    {[project.status, project.stack.slice(0, 3).join(", ")]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>

                <div className="flex shrink-0 gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setEditando({ ...project, html: project.html ?? null })}
                  >
                    {texts.common.edit}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full text-destructive"
                    onClick={() => {
                      if (confirm(texts.profile.projects.deleteConfirm)) excluir.mutate(project.id);
                    }}
                  >
                    {texts.profile.projects.remove}
                  </Button>
                </div>
              </div>
            ))}

            <Button
              className="rounded-full gap-1.5"
              onClick={() => {
                setModo("estruturado");
                setStackTexto("");
                setEditando(vazio());
              }}
            >
              {texts.profile.projects.add}
            </Button>
          </div>
        )}

        {editando && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap gap-2">
              {(["estruturado", "html"] as ProjectCardMode[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={modo === option}
                  onClick={() => setModo(option)}
                  className={
                    modo === option
                      ? "rounded-full border border-primary bg-primary-soft px-3 py-1.5 text-xs text-primary"
                      : "rounded-full border border-border-soft bg-surface-1 px-3 py-1.5 text-xs text-text-subtle hover:text-text-strong"
                  }
                >
                  {option === "estruturado"
                    ? texts.profile.projects.modeStructured
                    : texts.profile.projects.modeHtml}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {texts.profile.projects.titleField}
              </Label>

              <Input
                value={editando.title}
                maxLength={120}
                onChange={(event) => setEditando({ ...editando, title: event.target.value })}
              />
            </div>

            {modo === "estruturado" ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {texts.profile.projects.descriptionField}
                  </Label>

                  <Input
                    value={editando.description ?? ""}
                    maxLength={500}
                    placeholder={texts.profile.projects.descriptionPlaceholder}
                    onChange={(event) =>
                      setEditando({ ...editando, description: event.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {texts.profile.projects.statusField}
                  </Label>

                  <div className="flex flex-wrap gap-2">
                    {STATUS_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        aria-pressed={editando.status === preset}
                        onClick={() => setEditando({ ...editando, status: preset })}
                        className={
                          editando.status === preset
                            ? "rounded-full border border-primary bg-primary-soft px-3 py-1 text-xs text-primary"
                            : "rounded-full border border-border-soft px-3 py-1 text-xs text-text-subtle hover:text-text-strong"
                        }
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {texts.profile.projects.stackField}
                  </Label>

                  <Input
                    value={stackTexto}
                    maxLength={400}
                    placeholder="Java, React, Postgres"
                    onChange={(event) => setStackTexto(event.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {texts.profile.projects.repoField}
                  </Label>

                  <Input
                    value={editando.repoUrl ?? ""}
                    maxLength={500}
                    placeholder="https://github.com/…"
                    onChange={(event) => setEditando({ ...editando, repoUrl: event.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      {texts.profile.projects.diary}
                    </Label>

                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() =>
                        setEditando({
                          ...editando,
                          diary: [
                            ...editando.diary,
                            { date: new Date().toISOString().slice(0, 10), text: "" },
                          ],
                        })
                      }
                    >
                      {texts.profile.projects.diaryAdd}
                    </Button>
                  </div>

                  {editando.diary.map((entry, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="date"
                        value={entry.date}
                        className="w-36 shrink-0"
                        onChange={(event) => {
                          const diary = [...editando.diary];
                          diary[index] = { ...entry, date: event.target.value };
                          setEditando({ ...editando, diary });
                        }}
                      />
                      <Textarea
                        value={entry.text}
                        maxLength={400}
                        placeholder={texts.profile.projects.diaryText}
                        onChange={(event) => {
                          const diary = [...editando.diary];
                          diary[index] = { ...entry, text: event.target.value };
                          setEditando({ ...editando, diary });
                        }}
                      />

                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0 text-destructive"
                        aria-label={texts.accessibility.close}
                        onClick={() =>
                          setEditando({
                            ...editando,
                            diary: editando.diary.filter((_, i) => i !== index),
                          })
                        }
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {texts.profile.projects.modeHtml}
                </Label>

                <HtmlEditor
                  id="projeto-html"
                  value={editando.html ?? ""}
                  onChange={(value) => setEditando({ ...editando, html: value })}
                  label={texts.profile.projects.modeHtml}
                  description={texts.profile.projects.htmlFrame}
                  placeholder="<h2>Meu projeto</h2>"
                  emptyPreview={texts.profile.projects.empty}
                  frameTitle={texts.profile.projects.htmlFrame}
                  maxLength={20000}
                  // A prévia é uma janela do editor com altura de CARD (320px, rola por dentro) —
                  // com a moldura de celular padrão ela ficava com ~900px e empurrava o rodapé
                  // do diálogo para fora da tela.
                  previewClassName="mt-3 h-[320px] overflow-hidden rounded-xl border border-border-soft"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-border-soft pt-3">
              <Button variant="ghost" className="rounded-full" onClick={() => setEditando(null)}>
                {texts.common.cancel}
              </Button>

              <Button
                className="rounded-full"
                disabled={salvar.isPending}
                onClick={() => salvar.mutate()}
              >
                {texts.profile.projects.save}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
