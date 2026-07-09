import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDashboardSummary,
  fetchStacks,
  fetchStack,
  deployStack,
  scaleStackService,
  removeStack,
  fetchOperationsHistory,
  fetchOperationStatus
} from '../api/stackApi';
import type {
  StackDeploymentRequest,
  StackScaleRequest
} from '@dockverse/types';

export function useStacksDashboard() {
  return useQuery({
    queryKey: ['stacksDashboard'],
    queryFn: fetchDashboardSummary,
    refetchInterval: 10000,
  });
}

export function useStacks(enabled = true) {
  return useQuery({
    queryKey: ['stacks'],
    queryFn: fetchStacks,
    enabled,
    refetchInterval: 10000,
  });
}

export function useStackDetails(name: string) {
  return useQuery({
    queryKey: ['stack', name],
    queryFn: () => fetchStack(name),
    enabled: !!name,
    refetchInterval: 5000,
  });
}

export function useStackOperations() {
  return useQuery({
    queryKey: ['stackOperations'],
    queryFn: fetchOperationsHistory,
    refetchInterval: 5000,
  });
}

export function useStackOperation(operationId: string) {
  return useQuery({
    queryKey: ['stackOperation', operationId],
    queryFn: () => fetchOperationStatus(operationId),
    enabled: !!operationId,
    refetchInterval: (query) => {
      const data: any = query.state.data;
      return data?.status === 'running' ? 2000 : false;
    },
  });
}

// --- Mutations ---

export function useStackMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['stacksDashboard'] });
    queryClient.invalidateQueries({ queryKey: ['stacks'] });
    queryClient.invalidateQueries({ queryKey: ['stackOperations'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const deployMutation = useMutation({
    mutationFn: (input: StackDeploymentRequest) => deployStack(input),
    onSuccess: invalidate,
  });

  const scaleMutation = useMutation({
    mutationFn: (input: StackScaleRequest) => scaleStackService(input),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (name: string) => removeStack(name),
    onSuccess: invalidate,
  });

  return {
    deployStack: deployMutation.mutateAsync,
    isDeploying: deployMutation.isPending,

    scaleStackService: scaleMutation.mutateAsync,
    isScaling: scaleMutation.isPending,

    removeStack: removeMutation.mutateAsync,
    isRemoving: removeMutation.isPending,
  };
}
