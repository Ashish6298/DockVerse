import { useQuery } from '@tanstack/react-query';
import { fetchContainerStats, fetchMonitoringSummary } from '../api/monitoringApi';
import type { ContainerMetricsHistory, MonitoringSummary } from '@dockverse/types';

export function useMonitoringSummary() {
  return useQuery<MonitoringSummary>({
    queryKey: ['monitoringSummary'],
    queryFn: fetchMonitoringSummary,
    refetchInterval: 5000, // Poll summary statistics every 5 seconds
  });
}

export function useContainerStats(containerId: string) {
  return useQuery<ContainerMetricsHistory>({
    queryKey: ['containerStats', containerId],
    queryFn: () => fetchContainerStats(containerId),
    enabled: !!containerId,
    refetchInterval: 5000, // Poll container metric history every 5 seconds
  });
}
