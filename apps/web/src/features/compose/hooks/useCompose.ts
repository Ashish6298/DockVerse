import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTemplates,
  runComposeCommand,
  fetchOperationProgress,
  fetchOperationHistory
} from '../api/composeApi';
import type { DockerfileTemplate, ComposeOperationResponse } from '@dockverse/types';

export function useCompose() {
  const queryClient = useQueryClient();

  const templatesQuery = useQuery<DockerfileTemplate[]>({
    queryKey: ['composeTemplates'],
    queryFn: fetchTemplates,
    staleTime: 60000,
  });

  const historyQuery = useQuery<ComposeOperationResponse[]>({
    queryKey: ['composeHistory'],
    queryFn: fetchOperationHistory,
    refetchInterval: 10000,
  });

  const commandMutation = useMutation({
    mutationFn: runComposeCommand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['composeHistory'] });
      queryClient.invalidateQueries({ queryKey: ['containers'] });
    },
  });

  return {
    templates: templatesQuery.data || [],
    isLoadingTemplates: templatesQuery.isLoading,
    history: historyQuery.data || [],
    refetchHistory: historyQuery.refetch,

    runCommand: commandMutation.mutateAsync,
    isRunningCommand: commandMutation.isPending,
  };
}

export function useOperationProgress(operationId: string) {
  return useQuery({
    queryKey: ['composeOperationProgress', operationId],
    queryFn: () => fetchOperationProgress(operationId),
    enabled: !!operationId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === 'success' || data.status === 'failed')) {
        return false;
      }
      return 2000; // Poll compose output logs every 2 seconds
    },
  });
}
