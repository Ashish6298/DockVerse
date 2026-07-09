import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDashboardSummary,
  fetchHosts,
  createHost,
  updateHost,
  deleteHost,
  testConnection,
  connectHost,
  disconnectHost,
  syncMetadata,
  triggerExport,
  fetchOperationsHistory,
  fetchOperationStatus
} from '../api/hostApi';
import type { DockerHostInfo } from '@dockverse/types';

export function useHostsDashboard() {
  return useQuery({
    queryKey: ['hostsDashboard'],
    queryFn: fetchDashboardSummary,
    refetchInterval: 10000,
  });
}

export function useHostsList() {
  return useQuery({
    queryKey: ['hostsList'],
    queryFn: fetchHosts,
    refetchInterval: 10000,
  });
}

export function useHostOperations() {
  return useQuery({
    queryKey: ['hostOperations'],
    queryFn: fetchOperationsHistory,
    refetchInterval: 5000,
  });
}

export function useHostOperation(operationId: string) {
  return useQuery({
    queryKey: ['hostOperation', operationId],
    queryFn: () => fetchOperationStatus(operationId),
    enabled: !!operationId,
    refetchInterval: (query) => {
      const data: any = query.state.data;
      return data?.status === 'running' ? 2000 : false;
    },
  });
}

// --- Mutations ---

export function useHostMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['hostsDashboard'] });
    queryClient.invalidateQueries({ queryKey: ['hostsList'] });
    queryClient.invalidateQueries({ queryKey: ['hostOperations'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const createHostMutation = useMutation({
    mutationFn: (input: Omit<DockerHostInfo, 'id' | 'status' | 'latency' | 'lastSync' | 'cpuCount' | 'memory' | 'favorite' | 'archived'>) => createHost(input),
    onSuccess: invalidate,
  });

  const updateHostMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<DockerHostInfo> }) => updateHost(id, input),
    onSuccess: invalidate,
  });

  const deleteHostMutation = useMutation({
    mutationFn: (id: string) => deleteHost(id),
    onSuccess: invalidate,
  });

  const testConnectionMutation = useMutation({
    mutationFn: (id: string) => testConnection(id),
    onSuccess: invalidate,
  });

  const connectMutation = useMutation({
    mutationFn: (id: string) => connectHost(id),
    onSuccess: invalidate,
  });

  const disconnectMutation = useMutation({
    mutationFn: (id: string) => disconnectHost(id),
    onSuccess: invalidate,
  });

  const syncMetadataMutation = useMutation({
    mutationFn: (id: string) => syncMetadata(id),
    onSuccess: invalidate,
  });

  const exportMutation = useMutation({
    mutationFn: (format: 'json' | 'csv') => triggerExport(format),
    onSuccess: invalidate,
  });

  return {
    createHost: createHostMutation.mutateAsync,
    updateHost: updateHostMutation.mutateAsync,
    deleteHost: deleteHostMutation.mutateAsync,

    testConnection: testConnectionMutation.mutateAsync,
    connectHost: connectMutation.mutateAsync,
    disconnectHost: disconnectMutation.mutateAsync,
    syncMetadata: syncMetadataMutation.mutateAsync,

    triggerExport: exportMutation.mutateAsync,
  };
}
