import { useQuery } from '@tanstack/react-query';
import { fetchDashboardData } from '../api/dockerApi';
import type { DashboardSummary } from '@dockverse/types';
import APP_CONFIG from '../lib/config';

/**
 * Reusable React Query hook to fetch and poll Docker connection telemetry
 */
export function useDockerTelemetry() {
  return useQuery<DashboardSummary>({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    refetchInterval: APP_CONFIG.REST_POLLING_INTERVAL_MS > 0 ? APP_CONFIG.REST_POLLING_INTERVAL_MS : false,
  });
}
