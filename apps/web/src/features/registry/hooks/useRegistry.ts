import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProviders,
  loginToRegistry,
  logoutFromRegistry,
  pullRegistryImage,
  pushRegistryImage,
  fetchOperationProgress
} from '../api/registryApi';
import type { RegistryProvider } from '@dockverse/types';

export function useRegistry() {
  const queryClient = useQueryClient();

  const providersQuery = useQuery<RegistryProvider[]>({
    queryKey: ['registryProviders'],
    queryFn: fetchProviders,
    refetchInterval: 15000,
  });

  const loginMutation = useMutation({
    mutationFn: loginToRegistry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registryProviders'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutFromRegistry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registryProviders'] });
    },
  });

  const pullMutation = useMutation({
    mutationFn: pullRegistryImage,
  });

  const pushMutation = useMutation({
    mutationFn: pushRegistryImage,
  });

  return {
    providers: providersQuery.data || [],
    isLoadingProviders: providersQuery.isLoading,
    refetchProviders: providersQuery.refetch,

    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,

    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,

    pullImage: pullMutation.mutateAsync,
    isPulling: pullMutation.isPending,

    pushImage: pushMutation.mutateAsync,
    isPushing: pushMutation.isPending
  };
}

export function useRegistryOperation(operationId: string) {
  return useQuery({
    queryKey: ['registryOperation', operationId],
    queryFn: () => fetchOperationProgress(operationId),
    enabled: !!operationId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === 'success' || data.status === 'failed')) {
        return false;
      }
      return 2000; // Poll task output logs every 2 seconds
    },
  });
}
