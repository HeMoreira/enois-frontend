import type { CommentView } from "@/types/application/comment/comment-view";

export type CommentReactionsDialogProps = {
  postId: CommentView["postId"];
  commentId: CommentView["id"];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
