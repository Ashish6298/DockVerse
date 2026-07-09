import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDashboardSummary,
  fetchBackups,
  fetchBackup,
  createBackup,
  verifyBackup,
  restoreBackup,
  removeBackup,
  importBackup,
  pruneExpiredBackups,
  fetchSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  fetchOperationsHistory,
  fetchOperationStatus
} from '../api/backupApi';
import type { BackupSchedule } from '@dockverse/types';

export function useBackupsDashboard() {
  return useQuery({
    queryKey: ['backupsDashboard'],
    queryFn: fetchDashboardSummary,
    refetchInterval: 10000,
  });
}

export function useBackups() {
  return useQuery({
    queryKey: ['backups'],
    queryFn: fetchBackups,
    refetchInterval: 10000,
  });
}

export function useBackupDetails(id: string) {
  return useQuery({
    queryKey: ['backup', id],
    queryFn: () => fetchBackup(id),
    enabled: !!id,
  });
}

export function useBackupSchedules() {
  return useQuery({
    queryKey: ['backupSchedules'],
    queryFn: fetchSchedules,
  });
}

export function useBackupOperations() {
  return useQuery({
    queryKey: ['backupOperations'],
    queryFn: fetchOperationsHistory,
    refetchInterval: 5000,
  });
}

export function useBackupOperation(operationId: string) {
  return useQuery({
    queryKey: ['backupOperation', operationId],
    queryFn: () => fetchOperationStatus(operationId),
    enabled: !!operationId,
    refetchInterval: (query) => {
      const data: any = query.state.data;
      return data?.status === 'running' ? 2000 : false;
    },
  });
}

// --- Mutations ---

export function useBackupMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['backupsDashboard'] });
    queryClient.invalidateQueries({ queryKey: ['backups'] });
    queryClient.invalidateQueries({ queryKey: ['backupSchedules'] });
    queryClient.invalidateQueries({ queryKey: ['backupOperations'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const createBackupMutation = useMutation({
    mutationFn: (input: { name: string; type: 'full' | 'incremental' | 'selective'; resources: any }) => createBackup(input),
    onSuccess: invalidate,
  });

  const verifyBackupMutation = useMutation({
    mutationFn: (id: string) => verifyBackup(id),
    onSuccess: invalidate,
  });

  const restoreBackupMutation = useMutation({
    mutationFn: ({ id, selectResources }: { id: string; selectResources: any }) => restoreBackup(id, selectResources),
    onSuccess: invalidate,
  });

  const removeBackupMutation = useMutation({
    mutationFn: (id: string) => removeBackup(id),
    onSuccess: invalidate,
  });

  const importBackupMutation = useMutation({
    mutationFn: (input: any) => importBackup(input),
    onSuccess: invalidate,
  });

  const pruneMutation = useMutation({
    mutationFn: () => pruneExpiredBackups(),
    onSuccess: invalidate,
  });

  const createScheduleMutation = useMutation({
    mutationFn: (input: Omit<BackupSchedule, 'id'>) => createSchedule(input),
    onSuccess: invalidate,
  });

  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<BackupSchedule> }) => updateSchedule(id, input),
    onSuccess: invalidate,
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: invalidate,
  });

  return {
    createBackup: createBackupMutation.mutateAsync,
    isCreatingBackup: createBackupMutation.isPending,

    verifyBackup: verifyBackupMutation.mutateAsync,
    isVerifyingBackup: verifyBackupMutation.isPending,

    restoreBackup: restoreBackupMutation.mutateAsync,
    isRestoringBackup: restoreBackupMutation.isPending,

    removeBackup: removeBackupMutation.mutateAsync,
    isRemovingBackup: removeBackupMutation.isPending,

    importBackup: importBackupMutation.mutateAsync,
    isImporting: importBackupMutation.isPending,

    pruneExpiredBackups: pruneMutation.mutateAsync,
    isPruning: pruneMutation.isPending,

    createSchedule: createScheduleMutation.mutateAsync,
    updateSchedule: updateScheduleMutation.mutateAsync,
    deleteSchedule: deleteScheduleMutation.mutateAsync,
  };
}
