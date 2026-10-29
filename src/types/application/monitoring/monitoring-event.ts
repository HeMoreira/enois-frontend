import type { MonitoringEventLevel } from "./monitoring-event-level";

export type MonitoringEvent = {
  id: string;
  createdAt: string;
  level: MonitoringEventLevel;
  type: string;
  message: string;
  requestId: string | null;
  method: string | null;
  path: string | null;
  route: string | null;
  status: number | null;
  durationMs: number | null;
  userId: string | null;
  clientIp: string | null;
  deviceId: string | null;
  metadata: string | null;
};
