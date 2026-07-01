import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchNetworks,
  fetchNetworkById,
  createNetwork,
  deleteNetwork,
  connectContainer,
  disconnectContainer,
  pruneNetworks
} from '../api/networkApi';
import type { NetworkListItem, NetworkDetails } from '@dockverse/types';

export function useNetworks() {
  const queryClient = useQueryClient();

  const networksQuery = useQuery<NetworkListItem[]>({
    queryKey: ['networks'],
    queryFn: fetchNetworks,
    refetchInterval: 10000, // Poll network list every 10 seconds
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['networks'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const createMutation = useMutation({
    mutationFn: createNetwork,
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNetwork,
    onSuccess: invalidate,
  });

  const connectMutation = useMutation({
    mutationFn: ({ networkId, containerId }: { networkId: string; containerId: string }) =>
      connectContainer(networkId, containerId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['networks', variables.networkId] });
      invalidate();
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: ({ networkId, containerId, force }: { networkId: string; containerId: string; force?: boolean }) =>
      disconnectContainer(networkId, containerId, force),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['networks', variables.networkId] });
      invalidate();
    },
  });

  const pruneMutation = useMutation({
    mutationFn: pruneNetworks,
    onSuccess: invalidate,
  });

  return {
    networks: networksQuery.data || [],
    isLoading: networksQuery.isLoading,
    isError: networksQuery.isError,
    error: networksQuery.error,
    refetch: networksQuery.refetch,
    isFetching: networksQuery.isFetching,

    createNetwork: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    deleteNetwork: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    connectContainer: connectMutation.mutateAsync,
    isConnecting: connectMutation.isPending,

    disconnectContainer: disconnectMutation.mutateAsync,
    isDisconnecting: disconnectMutation.isPending,

    pruneNetworks: pruneMutation.mutateAsync,
    isPruning: pruneMutation.isPending,
  };
}

export function useNetwork(id: string) {
  return useQuery<NetworkDetails>({
    queryKey: ['networks', id],
    queryFn: () => fetchNetworkById(id),
    enabled: !!id,
    refetchInterval: 5000, // Poll details every 5 seconds if active
  });
}
