import type { ApiResponse, DashboardSummary } from '@dockverse/types';
import APP_CONFIG from '../lib/config';

/**
 * Fetch the aggregated dashboard telemetry and status
 */
export async function fetchDashboardData(): Promise<DashboardSummary> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/docker/dashboard`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network response was not ok' }));
    throw new Error(errorData.message || 'Failed to fetch dashboard data');
  }
  const result: ApiResponse<DashboardSummary> = await response.json();
  return result.data;
}
