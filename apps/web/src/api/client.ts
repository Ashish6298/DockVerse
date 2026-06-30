import { ApiResponse, DashboardSummary } from '@dockverse/types';

const API_BASE_URL = 'http://localhost:5000/api/v1';

export async function fetchDashboardData(): Promise<DashboardSummary> {
  const response = await fetch(`${API_BASE_URL}/docker/dashboard`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network response was not ok' }));
    throw new Error(errorData.message || 'Failed to fetch dashboard data');
  }
  const result: ApiResponse<DashboardSummary> = await response.json();
  return result.data;
}
