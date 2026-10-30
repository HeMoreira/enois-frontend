import type { Mentor } from "./mentor";

export type CreateMentorInput = Pick<Mentor, "expertise" | "price" | "banner" | "meetingUrl">;
