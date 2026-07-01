import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTemplates,
  startImageBuild,
  fetchBuildProgress,
  fetchBuildHistory
} from '../api/dockerfileApi';
import type { DockerfileTemplate, DockerBuildHistory } from '@dockverse/types';

export function useDockerfiles() {
  const queryClient = useQueryClient();

  const templatesQuery = useQuery<DockerfileTemplate[]>({
    queryKey: ['dockerfileTemplates'],
    queryFn: fetchTemplates,
    staleTime: 60000, // Templates do not change frequently
  });

  const historyQuery = useQuery<DockerBuildHistory[]>({
    queryKey: ['dockerfileBuildHistory'],
    queryFn: fetchBuildHistory,
    refetchInterval: 10000,
  });

  const buildMutation = useMutation({
    mutationFn: startImageBuild,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dockerfileBuildHistory'] });
    },
  });

  return {
    templates: templatesQuery.data || [],
    isLoadingTemplates: templatesQuery.isLoading,
    buildHistory: historyQuery.data || [],
    refetchHistory: historyQuery.refetch,

    startBuild: buildMutation.mutateAsync,
    isStartingBuild: buildMutation.isPending,
  };
}

export function useBuildProgress(buildId: string) {
  return useQuery({
    queryKey: ['buildProgress', buildId],
    queryFn: () => fetchBuildProgress(buildId),
    enabled: !!buildId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === 'success' || data.status === 'failed')) {
        return false; // Stop polling on final status
      }
      return 2000; // Poll build logs every 2 seconds
    },
  });
}
