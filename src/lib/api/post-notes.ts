import type { AdminPostNote } from "@/types/application/feed/admin-post-note";
import type { MyPostNote } from "@/types/application/feed/my-post-note";
import type { PostNoteList } from "@/types/application/feed/post-note-list";

import { api } from "../api-client";

/** Notas de rodapé da comunidade: envio com moderação e leitura pública das aprovadas. */
export const postNotesApi = {
  create: (postId: string, body: string) =>
    api.post<MyPostNote>(`/feed/posts/${encodeURIComponent(postId)}/notes`, { body }),

  list: (postId: string) =>
    api.get<PostNoteList>(`/feed/posts/${encodeURIComponent(postId)}/notes`),

  pending: () => api.get<AdminPostNote[]>("/admin/notes"),

  review: (id: string, data: { status: "APPROVED" | "DENIED"; reason?: string }) =>
    api.patch<{ id: string; status: string }>(`/admin/notes/${encodeURIComponent(id)}`, data),
};
