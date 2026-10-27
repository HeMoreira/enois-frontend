import { useState } from "react";

import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { PostNote } from "@/types/application/feed/post-note";
import type { PostView } from "@/types/application/feed/post-view";
import { BadgeCheck, Loader2, StickyNote } from "lucide-react";

import { postNotesApi } from "@/lib/api";
import { useCurrentUser } from "@/lib/current-user";
import { dataHora } from "@/lib/date/format";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

import { ContributorTag } from "@/components/contributor-tag";
import { StyledName } from "@/components/styled-name";

const MAX_NOTE = 500;
const MIN_NOTE = 10;

/**
 * Rodapé do post: notas aprovadas pela moderação aparecem como verificação da comunidade. Quem
 * ainda não enviou pode pedir uma correção; a nota vai para análise e só aparece depois de aprovada.
 * Nota negada reduz a credibilidade de quem enviou; aprovada (ou em análise) não muda nada.
 */
export function PostNotes({ post }: { post: PostView }) {
  const { data: currentUser } = useCurrentUser();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);

  const notes = post.communityNotes ?? [];
  const mine = post.myNote;
  const ownPost = Boolean(currentUser && currentUser.id === post.authorId);
  const showAdd = Boolean(currentUser) && !ownPost && notes.length === 0 && !mine && !sent;
  const pending = mine?.status === "PENDING" || sent;
  const denied = mine?.status === "DENIED";
  const discarded = mine?.status === "DISCARDED";

  const create = useMutation({
    mutationFn: () => postNotesApi.create(post.id, body.trim()),
    onSuccess: () => {
      setSent(true);
      setOpen(false);
      setBody("");
      toast(texts.posts.notes.sent, "success");
    },
    onError: () => toast(texts.posts.notes.error, "error"),
  });

  if (notes.length === 0 && !pending && !denied && !discarded && !showAdd) return null;

  return (
    <div className="mt-3 space-y-2">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}

      {pending && (
        <p className="flex items-center gap-1.5 rounded-lg bg-surface-2 px-3 py-2 text-xs text-text-subtle">
          <StickyNote className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />

          <>{texts.posts.notes.pending}</>
        </p>
      )}

      {denied && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {texts.posts.notes.denied(mine?.reviewReason ?? "")}
        </p>
      )}

      {discarded && (
        <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-text-subtle">
          {texts.posts.notes.discarded}
        </p>
      )}

      {showAdd && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <StickyNote className="h-3.5 w-3.5" aria-hidden />

          <>{texts.posts.notes.add}</>
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{texts.posts.notes.dialogTitle}</DialogTitle>

            <DialogDescription>{texts.posts.notes.dialogDescription}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-text-strong">
              {texts.posts.notes.warning}
            </p>

            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={4}
              maxLength={MAX_NOTE}
              placeholder={texts.posts.notes.placeholder}
            />

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-text-subtle">
                {body.trim().length}/{MAX_NOTE}
              </span>

              <Button
                className="rounded-full"
                disabled={
                  create.isPending || body.trim().length < MIN_NOTE || body.trim().length > MAX_NOTE
                }
                onClick={() => create.mutate()}
              >
                {create.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}

                <>{create.isPending ? texts.posts.notes.sending : texts.posts.notes.send}</>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NoteCard({ note }: { note: PostNote }) {
  const name = note.authorName ?? "";

  return (
    <aside className="rounded-xl border border-primary/30 bg-primary-soft/40 px-3 py-2">
      <p className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-primary-text">
        <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden />

        <>{texts.posts.notes.title}</>

        <span className="font-normal text-text-subtle">· {texts.posts.notes.verified}</span>
      </p>

      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-text-strong">{note.body}</p>

      <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-text-subtle">
        {note.authorUsername ? (
          <Link
            to="/perfil/$username"
            params={{ username: note.authorUsername }}
            className="hover:underline"
          >
            <StyledName name={name} style={note.authorStyle} />
          </Link>
        ) : (
          <span>
            <StyledName name={name} style={note.authorStyle} />
          </span>
        )}

        {note.authorContributor && <ContributorTag color={note.authorContributor.color} />}

        <span>· {dataHora(note.createdAt)}</span>
      </p>
    </aside>
  );
}
