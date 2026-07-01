import dockerService from '../docker/docker.service.js';
import logger from '../utils/logger.js';
import type { 
  ContainerMetricPoint, 
  ContainerMetricsHistory,
  MonitoringSummary 
} from '@dockverse/types';

class MonitoringService {
  // In-memory rolling history map (key: containerId, value: rolling array of metric points)
  private metricsBuffer: Record<string, ContainerMetricPoint[]> = {};
  private maxHistoryPoints = 60; // Holds ~5 minutes of data at 5-second polling intervals
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.startPolling();
  }

  public startPolling() {
    if (this.intervalId) return;

    this.intervalId = setInterval(async () => {
      try {
        if (dockerService.getStatus() === 'disconnected') {
          return; // Skip if Docker daemon is offline
        }
        const client = dockerService.getClient();
        const containers = await client.listContainers({ all: false }); // Fetch running only
        const activeIds = new Set(containers.map(c => c.Id));

        // Evict stopped/removed container metric history to prevent memory leaks
        for (const containerId of Object.keys(this.metricsBuffer)) {
          if (!activeIds.has(containerId)) {
            delete this.metricsBuffer[containerId];
          }
        }

        // Poll resource stats in parallel
        await Promise.all(
          containers.map(async (cInfo) => {
            const container = client.getContainer(cInfo.Id);
            try {
              const stats = await new Promise<any>((resolve, reject) => {
                container.stats({ stream: false }, (err: any, data: any) => {
                  if (err) resolve(null);
                  else resolve(data);
                });
              });

              if (!stats) return;

              // 1. Calculate CPU Percent
              let cpuPercent = 0.0;
              const cpuUsage = stats.cpu_stats?.cpu_usage?.total_usage || 0;
              const precpuUsage = stats.precpu_stats?.cpu_usage?.total_usage || 0;
              const systemCpu = stats.cpu_stats?.system_cpu_usage || 0;
              const presystemCpu = stats.precpu_stats?.system_cpu_usage || 0;
              
              const cpuDelta = cpuUsage - precpuUsage;
              const systemDelta = systemCpu - presystemCpu;
              const numCpus = stats.cpu_stats?.online_cpus || stats.precpu_stats?.online_cpus || 1;

              if (systemDelta > 0 && cpuDelta > 0) {
                cpuPercent = (cpuDelta / systemDelta) * numCpus * 100;
              }

              // 2. Calculate Memory stats
              const memoryBytes = stats.memory_stats?.usage || 0;
              const memoryLimit = stats.memory_stats?.limit || 1;
              const memoryPercent = (memoryBytes / memoryLimit) * 100;

              // 3. Network IO aggregation
              let networkRxBytes = 0;
              let networkTxBytes = 0;
              if (stats.networks) {
                for (const net of Object.values(stats.networks) as any[]) {
                  networkRxBytes += net.rx_bytes || 0;
                  networkTxBytes += net.tx_bytes || 0;
                }
              }

              // 4. Block IO bytes aggregation
              let ioReadBytes = 0;
              let ioWriteBytes = 0;
              if (stats.blkio_stats?.io_service_bytes_recursive) {
                for (const io of stats.blkio_stats.io_service_bytes_recursive) {
                  if (io.op === 'Read' || io.op === 'read') ioReadBytes += io.value || 0;
                  if (io.op === 'Write' || io.op === 'write') ioWriteBytes += io.value || 0;
                }
              }

              // Append to buffer
              if (!this.metricsBuffer[cInfo.Id]) {
                this.metricsBuffer[cInfo.Id] = [];
              }
              const points = this.metricsBuffer[cInfo.Id];
              points.push({
                timestamp: new Date().toISOString(),
                cpuPercent: parseFloat(cpuPercent.toFixed(2)),
                memoryBytes,
                memoryPercent: parseFloat(memoryPercent.toFixed(2)),
                networkRxBytes,
                networkTxBytes,
                ioReadBytes,
                ioWriteBytes
              });

              if (points.length > this.maxHistoryPoints) {
                points.shift();
              }
            } catch (err) {
              // Gracefully handle stats reading errors for transient containers
              logger.debug({ err, containerId: cInfo.Id }, 'Failed to read container stats');
            }
          })
        );
      } catch (err) {
        logger.error({ err }, 'Error in container monitoring collection thread');
      }
    }, 5000); // Poll daemon stats every 5 seconds
  }

  public getContainerStats(containerId: string): ContainerMetricsHistory {
    const points = this.metricsBuffer[containerId] || [];
    return {
      containerId,
      points
    };
  }

  public getSummary(): MonitoringSummary {
    let totalCpuPercent = 0;
    let totalMemoryBytes = 0;
    let totalNetworkRxBytes = 0;
    let totalNetworkTxBytes = 0;
    let runningContainersCount = 0;

    for (const points of Object.values(this.metricsBuffer)) {
      if (points.length > 0) {
        const last = points[points.length - 1];
        totalCpuPercent += last.cpuPercent;
        totalMemoryBytes += last.memoryBytes;
        totalNetworkRxBytes += last.networkRxBytes;
        totalNetworkTxBytes += last.networkTxBytes;
        runningContainersCount++;
      }
    }

    return {
      totalCpuPercent: parseFloat(totalCpuPercent.toFixed(2)),
      totalMemoryBytes,
      totalNetworkRxBytes,
      totalNetworkTxBytes,
      runningContainersCount
    };
  }

  public stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const monitoringService = new MonitoringService();
export default monitoringService;
