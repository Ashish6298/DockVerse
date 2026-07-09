import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDashboardSummary,
  fetchPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
  triggerScan,
  fetchFindings,
  acknowledgeFinding,
  ignoreFinding,
  resolveFinding,
  triggerExport,
  fetchSchedules,
  createSchedule,
  deleteSchedule,
  fetchOperationsHistory,
  fetchOperationStatus
} from '../api/policyApi';
import type { PolicyInfo, PolicyScanSchedule } from '@dockverse/types';

export function usePoliciesDashboard() {
  return useQuery({
    queryKey: ['policiesDashboard'],
    queryFn: fetchDashboardSummary,
    refetchInterval: 10000,
  });
}

export function usePoliciesList() {
  return useQuery({
    queryKey: ['policiesList'],
    queryFn: fetchPolicies,
  });
}

export function usePolicyFindings() {
  return useQuery({
    queryKey: ['policyFindings'],
    queryFn: fetchFindings,
    refetchInterval: 10000,
  });
}

export function usePolicySchedules() {
  return useQuery({
    queryKey: ['policySchedules'],
    queryFn: fetchSchedules,
  });
}

export function usePolicyOperations() {
  return useQuery({
    queryKey: ['policyOperations'],
    queryFn: fetchOperationsHistory,
    refetchInterval: 5000,
  });
}

export function usePolicyOperation(operationId: string) {
  return useQuery({
    queryKey: ['policyOperation', operationId],
    queryFn: () => fetchOperationStatus(operationId),
    enabled: !!operationId,
    refetchInterval: (query) => {
      const data: any = query.state.data;
      return data?.status === 'running' ? 2000 : false;
    },
  });
}

// --- Mutations ---

export function usePolicyMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['policiesDashboard'] });
    queryClient.invalidateQueries({ queryKey: ['policiesList'] });
    queryClient.invalidateQueries({ queryKey: ['policyFindings'] });
    queryClient.invalidateQueries({ queryKey: ['policySchedules'] });
    queryClient.invalidateQueries({ queryKey: ['policyOperations'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const createPolicyMutation = useMutation({
    mutationFn: (input: Omit<PolicyInfo, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => createPolicy(input),
    onSuccess: invalidate,
  });

  const updatePolicyMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PolicyInfo> }) => updatePolicy(id, input),
    onSuccess: invalidate,
  });

  const deletePolicyMutation = useMutation({
    mutationFn: (id: string) => deletePolicy(id),
    onSuccess: invalidate,
  });

  const scanMutation = useMutation({
    mutationFn: () => triggerScan(),
    onSuccess: invalidate,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: ({ id, justification }: { id: string; justification?: string }) => acknowledgeFinding(id, justification),
    onSuccess: invalidate,
  });

  const ignoreMutation = useMutation({
    mutationFn: ({ id, justification }: { id: string; justification?: string }) => ignoreFinding(id, justification),
    onSuccess: invalidate,
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => resolveFinding(id),
    onSuccess: invalidate,
  });

  const exportMutation = useMutation({
    mutationFn: (format: 'json' | 'csv') => triggerExport(format),
    onSuccess: invalidate,
  });

  const createScheduleMutation = useMutation({
    mutationFn: (input: Omit<PolicyScanSchedule, 'id'>) => createSchedule(input),
    onSuccess: invalidate,
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: invalidate,
  });

  return {
    createPolicy: createPolicyMutation.mutateAsync,
    updatePolicy: updatePolicyMutation.mutateAsync,
    deletePolicy: deletePolicyMutation.mutateAsync,

    triggerScan: scanMutation.mutateAsync,
    isScanning: scanMutation.isPending,

    acknowledgeFinding: acknowledgeMutation.mutateAsync,
    ignoreFinding: ignoreMutation.mutateAsync,
    resolveFinding: resolveMutation.mutateAsync,

    triggerExport: exportMutation.mutateAsync,

    createSchedule: createScheduleMutation.mutateAsync,
    deleteSchedule: deleteScheduleMutation.mutateAsync,
  };
}
