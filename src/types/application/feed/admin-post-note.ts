/** Nota pendente na fila de moderação. */
export type AdminPostNote = {
  id: string;
  postId: string;
  body: string;
  status: "PENDING";
  createdAt: string;
  authorId: string;
  authorUsername: string | null;
  authorName: string | null;
};
