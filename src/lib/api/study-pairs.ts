import type { MyStudyPairs } from "@/types/application/study-pairs/my-study-pairs";
import type { PopularStudyGoals } from "@/types/application/study-pairs/popular-study-goals";
import type { StudyPairCheckinView } from "@/types/application/study-pairs/study-pair-checkin-view";
import type { StudyPairRequestResult } from "@/types/application/study-pairs/study-pair-request-result";

import { api } from "../api-client";

/** Study pairs: everything needs a session; writes carry the Idempotency-Key from `api`. */
export const studyPairsApi = {
  me: () => api.get<MyStudyPairs>("/study-pairs/me"),

  popularGoals: () => api.get<PopularStudyGoals>("/study-pairs/goals/popular"),

  request: (goal: string, topic: string | null) =>
    api.post<StudyPairRequestResult>("/study-pairs/requests", { goal, topic }),

  cancelRequest: () =>
    api.delete<{ id: string; status: "CANCELLED" }>("/study-pairs/requests/current"),

  checkin: (pairId: string, note: string) =>
    api.post<StudyPairCheckinView>(`/study-pairs/${encodeURIComponent(pairId)}/checkins`, {
      note,
    }),

  end: (pairId: string) =>
    api.post<{ id: string; status: "ENDED" }>(`/study-pairs/${encodeURIComponent(pairId)}/end`),
};
