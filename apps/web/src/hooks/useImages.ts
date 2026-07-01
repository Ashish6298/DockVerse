import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchImages,
  fetchImageById,
  pullImage,
  deleteImage,
  tagImage,
  fetchImageHistory,
  pruneImages
} from '../api/imageApi';
import type { ImageListItem, ImageDetails, ImageHistoryItem } from '@dockverse/types';

export function useImages() {
  const queryClient = useQueryClient();

  const imagesQuery = useQuery<ImageListItem[]>({
    queryKey: ['images'],
    queryFn: fetchImages,
    refetchInterval: 10000, // Poll image list every 10 seconds
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['images'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const pullMutation = useMutation({
    mutationFn: pullImage,
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) => deleteImage(id, force),
    onSuccess: invalidate,
  });

  const tagMutation = useMutation({
    mutationFn: ({ id, repo, tag }: { id: string; repo: string; tag?: string }) => tagImage(id, { repo, tag }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['images', variables.id] });
      invalidate();
    },
  });

  const pruneMutation = useMutation({
    mutationFn: pruneImages,
    onSuccess: invalidate,
  });

  return {
    images: imagesQuery.data || [],
    isLoading: imagesQuery.isLoading,
    isError: imagesQuery.isError,
    error: imagesQuery.error,
    refetch: imagesQuery.refetch,
    isFetching: imagesQuery.isFetching,

    pullImage: pullMutation.mutateAsync,
    isPulling: pullMutation.isPending,

    deleteImage: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    tagImage: tagMutation.mutateAsync,
    isTagging: tagMutation.isPending,

    pruneImages: pruneMutation.mutateAsync,
    isPruning: pruneMutation.isPending,
  };
}

export function useImage(id: string) {
  const imageQuery = useQuery<ImageDetails>({
    queryKey: ['images', id],
    queryFn: () => fetchImageById(id),
    enabled: !!id,
  });

  const historyQuery = useQuery<ImageHistoryItem[]>({
    queryKey: ['images', id, 'history'],
    queryFn: () => fetchImageHistory(id),
    enabled: !!id,
  });

  return {
    image: imageQuery.data,
    isLoading: imageQuery.isLoading,
    isError: imageQuery.isError,
    error: imageQuery.error,

    history: historyQuery.data || [],
    isLoadingHistory: historyQuery.isLoading,
  };
}
