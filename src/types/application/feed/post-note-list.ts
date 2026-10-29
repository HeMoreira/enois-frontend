import type { MyPostNote } from "./my-post-note";
import type { PostNote } from "./post-note";

/** Resposta da leitura das notas de um post: aprovadas + a nota do próprio leitor. */
export type PostNoteList = {
  items: PostNote[];
  mine: MyPostNote | null;
};
