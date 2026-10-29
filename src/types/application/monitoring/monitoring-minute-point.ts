export type MonitoringMinutePoint = {
  minute: string;
  requests: number;
  requests2xx: number;
  requests3xx: number;
  errors4xx: number;
  errors5xx: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
  slowRequests: number;
  rateLimited: number;
  cpuPercent: number;
  heapMb: number;
};
