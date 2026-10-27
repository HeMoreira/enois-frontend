/** Nota do próprio leitor num post, em qualquer estado. */
export type MyPostNote = {
  id: string;
  postId: string;
  body: string;
  status: "PENDING" | "APPROVED" | "DENIED" | "DISCARDED";
  reviewReason: string | null;
  createdAt: string;
};
