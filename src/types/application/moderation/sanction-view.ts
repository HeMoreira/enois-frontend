/** Sancao como o usuario a ve (GET /me/sanctions). */
export type SanctionView = {
  id: string;
  userId: string;
  reportId: string | null;
  type: "RESTRICTION" | "SUSPENDED" | "BAN";
  reason: string | null;
  status: "ACTIVE" | "REMOVED";
  createdAt: string;
  removedAt: string | null;
};
