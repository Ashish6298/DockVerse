import type { 
  ApiResponse, 
  ContainerMetricsHistory, 
  MonitoringSummary
} from '@dockverse/types';
import APP_CONFIG from '../../../lib/config';

export async function fetchContainerStats(containerId: string): Promise<ContainerMetricsHistory> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/monitoring/containers/${containerId}/stats`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch container stats' }));
    throw new Error(errorData.message || 'Failed to fetch container stats');
  }
  const result: ApiResponse<ContainerMetricsHistory> = await response.json();
  return result.data;
}

export async function fetchMonitoringSummary(): Promise<MonitoringSummary> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/monitoring/summary`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch summary' }));
    throw new Error(errorData.message || 'Failed to fetch summary');
  }
  const result: ApiResponse<MonitoringSummary> = await response.json();
  return result.data;
}
