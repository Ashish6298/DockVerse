import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSwarmStatus,
  fetchSwarmInspect,
  initSwarm,
  joinSwarm,
  leaveSwarm,
  fetchSwarmTokens,
  rotateSwarmTokens,
  fetchSwarmUnlockKey,
  updateSwarmSpec,
  fetchSwarmNodes,
  fetchSwarmNode,
  promoteNode,
  demoteNode,
  drainNode,
  activateNode,
  pauseNode,
  removeNode,
  fetchSwarmServices,
  fetchSwarmService,
  fetchSwarmTasks,
  fetchSwarmTask,
  fetchClusterHealth,
  fetchOperationsHistory,
  fetchOperationStatus
} from '../api/swarmApi';
import type {
  SwarmInitRequest,
  SwarmJoinRequest,
  SwarmLeaveRequest,
  SwarmSpecUpdateRequest
} from '@dockverse/types';

export function useSwarmStatus() {
  return useQuery({
    queryKey: ['swarmStatus'],
    queryFn: fetchSwarmStatus,
    refetchInterval: 10000,
  });
}

export function useSwarmInspect(enabled = true) {
  return useQuery({
    queryKey: ['swarmInspect'],
    queryFn: fetchSwarmInspect,
    enabled,
  });
}

export function useSwarmTokens(enabled = true) {
  return useQuery({
    queryKey: ['swarmTokens'],
    queryFn: fetchSwarmTokens,
    enabled,
  });
}

export function useSwarmUnlockKey(enabled = true) {
  return useQuery({
    queryKey: ['swarmUnlockKey'],
    queryFn: fetchSwarmUnlockKey,
    enabled,
  });
}

export function useSwarmNodes(enabled = true) {
  return useQuery({
    queryKey: ['swarmNodes'],
    queryFn: fetchSwarmNodes,
    enabled,
    refetchInterval: 10000,
  });
}

export function useSwarmNode(id: string) {
  return useQuery({
    queryKey: ['swarmNode', id],
    queryFn: () => fetchSwarmNode(id),
    enabled: !!id,
    refetchInterval: 5000,
  });
}

export function useSwarmServices(enabled = true) {
  return useQuery({
    queryKey: ['swarmServices'],
    queryFn: fetchSwarmServices,
    enabled,
    refetchInterval: 10000,
  });
}

export function useSwarmService(id: string) {
  return useQuery({
    queryKey: ['swarmService', id],
    queryFn: () => fetchSwarmService(id),
    enabled: !!id,
    refetchInterval: 5000,
  });
}

export function useSwarmTasks(serviceId?: string, enabled = true) {
  return useQuery({
    queryKey: ['swarmTasks', serviceId],
    queryFn: () => fetchSwarmTasks(serviceId),
    enabled,
    refetchInterval: 10000,
  });
}

export function useSwarmTask(id: string) {
  return useQuery({
    queryKey: ['swarmTask', id],
    queryFn: () => fetchSwarmTask(id),
    enabled: !!id,
  });
}

export function useClusterHealth(enabled = true) {
  return useQuery({
    queryKey: ['swarmHealth'],
    queryFn: fetchClusterHealth,
    enabled,
    refetchInterval: 5000,
  });
}

export function useOperationsHistory() {
  return useQuery({
    queryKey: ['swarmOperations'],
    queryFn: fetchOperationsHistory,
    refetchInterval: 5000,
  });
}

export function useOperationStatus(operationId: string) {
  return useQuery({
    queryKey: ['swarmOperation', operationId],
    queryFn: () => fetchOperationStatus(operationId),
    enabled: !!operationId,
    refetchInterval: (query) => {
      const data: any = query.state.data;
      return data?.status === 'running' ? 2000 : false;
    },
  });
}

// --- Mutations ---

export function useSwarmMutations() {
  const queryClient = useQueryClient();

  const invalidateSwarm = () => {
    queryClient.invalidateQueries({ queryKey: ['swarmStatus'] });
    queryClient.invalidateQueries({ queryKey: ['swarmInspect'] });
    queryClient.invalidateQueries({ queryKey: ['swarmTokens'] });
    queryClient.invalidateQueries({ queryKey: ['swarmNodes'] });
    queryClient.invalidateQueries({ queryKey: ['swarmServices'] });
    queryClient.invalidateQueries({ queryKey: ['swarmTasks'] });
    queryClient.invalidateQueries({ queryKey: ['swarmHealth'] });
    queryClient.invalidateQueries({ queryKey: ['swarmOperations'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const initMutation = useMutation({
    mutationFn: (input: SwarmInitRequest) => initSwarm(input),
    onSuccess: invalidateSwarm,
  });

  const joinMutation = useMutation({
    mutationFn: (input: SwarmJoinRequest) => joinSwarm(input),
    onSuccess: invalidateSwarm,
  });

  const leaveMutation = useMutation({
    mutationFn: (input: SwarmLeaveRequest) => leaveSwarm(input),
    onSuccess: invalidateSwarm,
  });

  const rotateTokensMutation = useMutation({
    mutationFn: (role: 'manager' | 'worker') => rotateSwarmTokens(role),
    onSuccess: invalidateSwarm,
  });

  const updateSpecMutation = useMutation({
    mutationFn: (input: SwarmSpecUpdateRequest) => updateSwarmSpec(input),
    onSuccess: invalidateSwarm,
  });

  const promoteNodeMutation = useMutation({
    mutationFn: (id: string) => promoteNode(id),
    onSuccess: invalidateSwarm,
  });

  const demoteNodeMutation = useMutation({
    mutationFn: (id: string) => demoteNode(id),
    onSuccess: invalidateSwarm,
  });

  const drainNodeMutation = useMutation({
    mutationFn: (id: string) => drainNode(id),
    onSuccess: invalidateSwarm,
  });

  const activateNodeMutation = useMutation({
    mutationFn: (id: string) => activateNode(id),
    onSuccess: invalidateSwarm,
  });

  const pauseNodeMutation = useMutation({
    mutationFn: (id: string) => pauseNode(id),
    onSuccess: invalidateSwarm,
  });

  const removeNodeMutation = useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) => removeNode(id, force),
    onSuccess: invalidateSwarm,
  });

  return {
    initSwarm: initMutation.mutateAsync,
    isInitializing: initMutation.isPending,

    joinSwarm: joinMutation.mutateAsync,
    isJoining: joinMutation.isPending,

    leaveSwarm: leaveMutation.mutateAsync,
    isLeaving: leaveMutation.isPending,

    rotateTokens: rotateTokensMutation.mutateAsync,
    isRotatingTokens: rotateTokensMutation.isPending,

    updateSpec: updateSpecMutation.mutateAsync,
    isUpdatingSpec: updateSpecMutation.isPending,

    promoteNode: promoteNodeMutation.mutateAsync,
    isPromotingNode: promoteNodeMutation.isPending,

    demoteNode: demoteNodeMutation.mutateAsync,
    isDemotingNode: demoteNodeMutation.isPending,

    drainNode: drainNodeMutation.mutateAsync,
    isDrainingNode: drainNodeMutation.isPending,

    activateNode: activateNodeMutation.mutateAsync,
    isActivatingNode: activateNodeMutation.isPending,

    pauseNode: pauseNodeMutation.mutateAsync,
    isPausingNode: pauseNodeMutation.isPending,

    removeNode: removeNodeMutation.mutateAsync,
    isRemovingNode: removeNodeMutation.isPending,
  };
}
