import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchContainers,
  fetchContainerById,
  createContainer,
  startContainer,
  stopContainer,
  restartContainer,
  pauseContainer,
  unpauseContainer,
  killContainer,
  removeContainer,
  renameContainer,
  fetchContainerLogs
} from '../api/containerApi';
import type { ContainerListItem, ContainerDetails } from '@dockverse/types';

export function useContainers() {
  const queryClient = useQueryClient();

  const containersQuery = useQuery<ContainerListItem[]>({
    queryKey: ['containers'],
    queryFn: fetchContainers,
    refetchInterval: 5000, // Auto-poll containers list every 5 seconds
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['containers'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const createMutation = useMutation({
    mutationFn: createContainer,
    onSuccess: invalidate,
  });

  const startMutation = useMutation({
    mutationFn: startContainer,
    onSuccess: invalidate,
  });

  const stopMutation = useMutation({
    mutationFn: stopContainer,
    onSuccess: invalidate,
  });

  const restartMutation = useMutation({
    mutationFn: restartContainer,
    onSuccess: invalidate,
  });

  const pauseMutation = useMutation({
    mutationFn: pauseContainer,
    onSuccess: invalidate,
  });

  const unpauseMutation = useMutation({
    mutationFn: unpauseContainer,
    onSuccess: invalidate,
  });

  const killMutation = useMutation({
    mutationFn: killContainer,
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) => removeContainer(id, force),
    onSuccess: invalidate,
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameContainer(id, name),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['containers', variables.id] });
      invalidate();
    },
  });

  return {
    containers: containersQuery.data || [],
    isLoading: containersQuery.isLoading,
    isError: containersQuery.isError,
    error: containersQuery.error,
    refetch: containersQuery.refetch,
    isFetching: containersQuery.isFetching,
    
    createContainer: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    
    startContainer: startMutation.mutateAsync,
    isStarting: startMutation.isPending,
    
    stopContainer: stopMutation.mutateAsync,
    isStopping: stopMutation.isPending,
    
    restartContainer: restartMutation.mutateAsync,
    isRestarting: restartMutation.isPending,
    
    pauseContainer: pauseMutation.mutateAsync,
    isPausing: pauseMutation.isPending,
    
    unpauseContainer: unpauseMutation.mutateAsync,
    isUnpausing: unpauseMutation.isPending,
    
    killContainer: killMutation.mutateAsync,
    isKilling: killMutation.isPending,
    
    removeContainer: removeMutation.mutateAsync,
    isRemoving: removeMutation.isPending,
    
    renameContainer: renameMutation.mutateAsync,
    isRenaming: renameMutation.isPending,
  };
}

export function useContainer(id: string) {
  const containerQuery = useQuery<ContainerDetails>({
    queryKey: ['containers', id],
    queryFn: () => fetchContainerById(id),
    enabled: !!id,
    refetchInterval: 5000, // Poll details every 5 seconds if active
  });

  const logsQuery = useQuery<string[]>({
    queryKey: ['containers', id, 'logs'],
    queryFn: () => fetchContainerLogs(id, 100),
    enabled: !!id,
    refetchInterval: 3000, // Poll logs every 3 seconds for simulated stream
  });

  return {
    container: containerQuery.data,
    isLoading: containerQuery.isLoading,
    isError: containerQuery.isError,
    error: containerQuery.error,
    refetch: containerQuery.refetch,
    
    logs: logsQuery.data || [],
    isLoadingLogs: logsQuery.isLoading,
    refetchLogs: logsQuery.refetch,
  };
}
