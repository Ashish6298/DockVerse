import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDashboardSummary,
  fetchSecrets,
  fetchSecret,
  fetchSecretUsage,
  createSecret,
  removeSecret,
  fetchConfigs,
  fetchConfig,
  fetchConfigUsage,
  createConfig,
  removeConfig,
  fetchOperationsHistory,
  fetchOperationStatus
} from '../api/resourceApi';
import type {
  SecretCreateRequest,
  ConfigCreateRequest
} from '@dockverse/types';

export function useResourcesDashboard() {
  return useQuery({
    queryKey: ['resourcesDashboard'],
    queryFn: fetchDashboardSummary,
    refetchInterval: 10000,
  });
}

export function useSecrets(enabled = true) {
  return useQuery({
    queryKey: ['secrets'],
    queryFn: fetchSecrets,
    enabled,
    refetchInterval: 10000,
  });
}

export function useSecretDetails(id: string) {
  return useQuery({
    queryKey: ['secret', id],
    queryFn: () => fetchSecret(id),
    enabled: !!id,
  });
}

export function useSecretUsage(id: string) {
  return useQuery({
    queryKey: ['secretUsage', id],
    queryFn: () => fetchSecretUsage(id),
    enabled: !!id,
    refetchInterval: 5000,
  });
}

export function useConfigs(enabled = true) {
  return useQuery({
    queryKey: ['configs'],
    queryFn: fetchConfigs,
    enabled,
    refetchInterval: 10000,
  });
}

export function useConfigDetails(id: string) {
  return useQuery({
    queryKey: ['config', id],
    queryFn: () => fetchConfig(id),
    enabled: !!id,
  });
}

export function useConfigUsage(id: string) {
  return useQuery({
    queryKey: ['configUsage', id],
    queryFn: () => fetchConfigUsage(id),
    enabled: !!id,
    refetchInterval: 5000,
  });
}

export function useResourceOperations() {
  return useQuery({
    queryKey: ['resourceOperations'],
    queryFn: fetchOperationsHistory,
    refetchInterval: 5000,
  });
}

export function useResourceOperation(operationId: string) {
  return useQuery({
    queryKey: ['resourceOperation', operationId],
    queryFn: () => fetchOperationStatus(operationId),
    enabled: !!operationId,
    refetchInterval: (query) => {
      const data: any = query.state.data;
      return data?.status === 'running' ? 2000 : false;
    },
  });
}

// --- Mutations ---

export function useResourceMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['resourcesDashboard'] });
    queryClient.invalidateQueries({ queryKey: ['secrets'] });
    queryClient.invalidateQueries({ queryKey: ['configs'] });
    queryClient.invalidateQueries({ queryKey: ['resourceOperations'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const createSecretMutation = useMutation({
    mutationFn: (input: SecretCreateRequest) => createSecret(input),
    onSuccess: invalidate,
  });

  const removeSecretMutation = useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) => removeSecret(id, force),
    onSuccess: invalidate,
  });

  const createConfigMutation = useMutation({
    mutationFn: (input: ConfigCreateRequest) => createConfig(input),
    onSuccess: invalidate,
  });

  const removeConfigMutation = useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) => removeConfig(id, force),
    onSuccess: invalidate,
  });

  return {
    createSecret: createSecretMutation.mutateAsync,
    isCreatingSecret: createSecretMutation.isPending,

    removeSecret: removeSecretMutation.mutateAsync,
    isRemovingSecret: removeSecretMutation.isPending,

    createConfig: createConfigMutation.mutateAsync,
    isCreatingConfig: createConfigMutation.isPending,

    removeConfig: removeConfigMutation.mutateAsync,
    isRemovingConfig: removeConfigMutation.isPending,
  };
}
