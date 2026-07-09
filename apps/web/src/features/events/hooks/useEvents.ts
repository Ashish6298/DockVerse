import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDashboardSummary,
  fetchEvents,
  triggerExport,
  triggerMaintenance,
  fetchSchedules,
  createSchedule,
  deleteSchedule,
  fetchOperationsHistory,
  fetchOperationStatus
} from '../api/eventApi';
import type { AuditEventSchedule } from '@dockverse/types';

export function useEventsDashboard() {
  return useQuery({
    queryKey: ['eventsDashboard'],
    queryFn: fetchDashboardSummary,
    refetchInterval: 5000,
  });
}

export function useEventsList(filters: { severity?: string; resourceType?: string; searchTerm?: string } = {}) {
  return useQuery({
    queryKey: ['eventsList', filters],
    queryFn: () => fetchEvents(filters),
    refetchInterval: 5000,
  });
}

export function useEventSchedules() {
  return useQuery({
    queryKey: ['eventSchedules'],
    queryFn: fetchSchedules,
  });
}

export function useEventOperations() {
  return useQuery({
    queryKey: ['eventOperations'],
    queryFn: fetchOperationsHistory,
    refetchInterval: 5000,
  });
}

export function useEventOperation(operationId: string) {
  return useQuery({
    queryKey: ['eventOperation', operationId],
    queryFn: () => fetchOperationStatus(operationId),
    enabled: !!operationId,
    refetchInterval: (query) => {
      const data: any = query.state.data;
      return data?.status === 'running' ? 2000 : false;
    },
  });
}

// --- Mutations ---

export function useEventMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['eventsDashboard'] });
    queryClient.invalidateQueries({ queryKey: ['eventsList'] });
    queryClient.invalidateQueries({ queryKey: ['eventSchedules'] });
    queryClient.invalidateQueries({ queryKey: ['eventOperations'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const exportMutation = useMutation({
    mutationFn: (format: 'json' | 'csv') => triggerExport(format),
    onSuccess: invalidate,
  });

  const maintenanceMutation = useMutation({
    mutationFn: () => triggerMaintenance(),
    onSuccess: invalidate,
  });

  const createScheduleMutation = useMutation({
    mutationFn: (input: Omit<AuditEventSchedule, 'id'>) => createSchedule(input),
    onSuccess: invalidate,
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: invalidate,
  });

  return {
    triggerExport: exportMutation.mutateAsync,
    isExporting: exportMutation.isPending,

    triggerMaintenance: maintenanceMutation.mutateAsync,
    isMaintaining: maintenanceMutation.isPending,

    createSchedule: createScheduleMutation.mutateAsync,
    deleteSchedule: deleteScheduleMutation.mutateAsync,
  };
}
