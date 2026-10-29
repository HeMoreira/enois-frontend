import type { MonitoringDbPool } from "./monitoring-db-pool";

export type MonitoringResource = {
  heapUsedBytes: number;
  heapCommittedBytes: number;
  heapMaxBytes: number;
  nonHeapUsedBytes: number;
  gcCount: number;
  gcTimeMs: number;
  threads: number;
  peakThreads: number;
  daemonThreads: number;
  loadedClasses: number;
  processCpuPercent: number;
  systemCpuPercent: number;
  loadAverage: number;
  processors: number;
  systemMemoryTotalBytes: number;
  systemMemoryFreeBytes: number;
  diskTotalBytes: number;
  diskFreeBytes: number;
  cgroupMemoryUsedBytes: number;
  cgroupMemoryMaxBytes: number;
  cgroupCpuCores: number;
  cgroupCpuPercent: number;
  dbPool: MonitoringDbPool | null;
};
