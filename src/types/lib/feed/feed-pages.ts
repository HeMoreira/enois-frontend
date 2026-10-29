import type { PageResponse } from "@/types/application/api/page-response";
import type { PostView } from "@/types/application/feed/post-view";

export type FeedPages = {
  pages: PageResponse<PostView>[];
  pageParams: unknown[];
};
