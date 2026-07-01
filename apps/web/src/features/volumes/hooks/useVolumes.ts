import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchVolumes,
  fetchVolumeByName,
  createVolume,
  deleteVolume,
  pruneVolumes
} from '../api/volumeApi';
import type { VolumeSummary, VolumeDetails } from '@dockverse/types';

export function useVolumes() {
  const queryClient = useQueryClient();

  const volumesQuery = useQuery<VolumeSummary[]>({
    queryKey: ['volumes'],
    queryFn: fetchVolumes,
    refetchInterval: 10000, // Poll volumes every 10 seconds
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['volumes'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const createMutation = useMutation({
    mutationFn: createVolume,
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVolume,
    onSuccess: invalidate,
  });

  const pruneMutation = useMutation({
    mutationFn: pruneVolumes,
    onSuccess: invalidate,
  });

  return {
    volumes: volumesQuery.data || [],
    isLoading: volumesQuery.isLoading,
    isError: volumesQuery.isError,
    error: volumesQuery.error,
    refetch: volumesQuery.refetch,
    isFetching: volumesQuery.isFetching,

    createVolume: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    deleteVolume: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    pruneVolumes: pruneMutation.mutateAsync,
    isPruning: pruneMutation.isPending,
  };
}

export function useVolume(name: string) {
  return useQuery<VolumeDetails>({
    queryKey: ['volumes', name],
    queryFn: () => fetchVolumeByName(name),
    enabled: !!name,
    refetchInterval: 5000, // Poll details every 5 seconds if active
  });
}
