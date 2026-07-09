import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDashboardSummary,
  fetchFindings,
  ignoreFinding,
  triggerScan,
  fetchSchedules,
  createSchedule,
  deleteSchedule,
  fetchOperationsHistory,
  fetchOperationStatus
} from '../api/securityApi';
import type { SecurityScanSchedule } from '@dockverse/types';

export function useSecurityDashboard() {
  return useQuery({
    queryKey: ['securityDashboard'],
    queryFn: fetchDashboardSummary,
    refetchInterval: 10000,
  });
}

export function useSecurityFindings(targetId?: string) {
  return useQuery({
    queryKey: ['securityFindings', targetId],
    queryFn: () => fetchFindings(targetId),
    refetchInterval: 10000,
  });
}

export function useSecuritySchedules() {
  return useQuery({
    queryKey: ['securitySchedules'],
    queryFn: fetchSchedules,
  });
}

export function useSecurityOperations() {
  return useQuery({
    queryKey: ['securityOperations'],
    queryFn: fetchOperationsHistory,
    refetchInterval: 5000,
  });
}

export function useSecurityOperation(operationId: string) {
  return useQuery({
    queryKey: ['securityOperation', operationId],
    queryFn: () => fetchOperationStatus(operationId),
    enabled: !!operationId,
    refetchInterval: (query) => {
      const data: any = query.state.data;
      return data?.status === 'running' ? 2000 : false;
    },
  });
}

// --- Mutations ---

export function useSecurityMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['securityDashboard'] });
    queryClient.invalidateQueries({ queryKey: ['securityFindings'] });
    queryClient.invalidateQueries({ queryKey: ['securitySchedules'] });
    queryClient.invalidateQueries({ queryKey: ['securityOperations'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const triggerScanMutation = useMutation({
    mutationFn: (input: { targetType: 'container' | 'image' | 'system'; targetId: string; category: string }) => triggerScan(input),
    onSuccess: invalidate,
  });

  const ignoreFindingMutation = useMutation({
    mutationFn: (id: string) => ignoreFinding(id),
    onSuccess: invalidate,
  });

  const createScheduleMutation = useMutation({
    mutationFn: (input: Omit<SecurityScanSchedule, 'id'>) => createSchedule(input),
    onSuccess: invalidate,
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: invalidate,
  });

  return {
    triggerScan: triggerScanMutation.mutateAsync,
    isScanning: triggerScanMutation.isPending,

    ignoreFinding: ignoreFindingMutation.mutateAsync,
    isIgnoringFinding: ignoreFindingMutation.isPending,

    createSchedule: createScheduleMutation.mutateAsync,
    deleteSchedule: deleteScheduleMutation.mutateAsync,
  };
}
