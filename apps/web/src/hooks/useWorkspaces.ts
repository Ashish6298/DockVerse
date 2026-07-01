import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchWorkspaces,
  fetchWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace
} from '../api/workspaceApi';
import type { Workspace } from '@dockverse/types';

export function useWorkspaces() {
  const queryClient = useQueryClient();

  const workspacesQuery = useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: fetchWorkspaces,
  });

  const createMutation = useMutation({
    mutationFn: createWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Omit<Workspace, '_id' | 'createdAt' | 'updatedAt'>> }) =>
      updateWorkspace(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  return {
    workspaces: workspacesQuery.data || [],
    isLoading: workspacesQuery.isLoading,
    isError: workspacesQuery.isError,
    error: workspacesQuery.error,
    refetch: workspacesQuery.refetch,
    isFetching: workspacesQuery.isFetching,
    createWorkspace: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateWorkspace: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteWorkspace: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

export function useWorkspace(id: string) {
  return useQuery<Workspace>({
    queryKey: ['workspaces', id],
    queryFn: () => fetchWorkspaceById(id),
    enabled: !!id,
  });
}
