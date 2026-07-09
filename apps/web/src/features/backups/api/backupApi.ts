import type {
  ApiResponse,
  BackupInfo,
  BackupSchedule,
  BackupDashboardSummary,
  BackupOperationStatus
} from '@dockverse/types';
import APP_CONFIG from '../../../lib/config';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'HTTP Request failed' }));
    throw new Error(errorData.message || 'HTTP Request failed');
  }
  const result: ApiResponse<T> = await response.json();
  return result.data;
}

export async function fetchDashboardSummary(): Promise<BackupDashboardSummary> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/backups/dashboard`);
  return handleResponse(response);
}

export async function fetchBackups(): Promise<BackupInfo[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/backups`);
  return handleResponse(response);
}

export async function fetchBackup(id: string): Promise<BackupInfo> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/backups/${id}`);
  return handleResponse(response);
}

export async function createBackup(input: { name: string; type: 'full' | 'incremental' | 'selective'; resources: any }): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/backups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse(response);
}

export async function verifyBackup(id: string): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/backups/${id}/verify`, {
    method: 'POST',
  });
  return handleResponse(response);
}

export async function restoreBackup(id: string, selectResources: any): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/backups/${id}/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resources: selectResources }),
  });
  return handleResponse(response);
}

export async function downloadBackup(id: string): Promise<Blob> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/backups/${id}/download`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to download backup');
  return response.blob();
}

export async function removeBackup(id: string): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/backups/${id}`, {
    method: 'DELETE',
  });
  await handleResponse(response);
}

export async function importBackup(input: any): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/backups/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse(response);
}

export async function pruneExpiredBackups(): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/backups/prune`, {
    method: 'POST',
  });
  await handleResponse(response);
}

export async function fetchSchedules(): Promise<BackupSchedule[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/backups/schedules`);
  return handleResponse(response);
}

export async function createSchedule(input: Omit<BackupSchedule, 'id'>): Promise<BackupSchedule> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/backups/schedules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse(response);
}

export async function updateSchedule(id: string, input: Partial<BackupSchedule>): Promise<BackupSchedule> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/backups/schedules/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse(response);
}

export async function deleteSchedule(id: string): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/backups/schedules/${id}`, {
    method: 'DELETE',
  });
  await handleResponse(response);
}

export async function fetchOperationsHistory(): Promise<BackupOperationStatus[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/backups/operations`);
  return handleResponse(response);
}

export async function fetchOperationStatus(operationId: string): Promise<BackupOperationStatus> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/backups/operations/${operationId}`);
  return handleResponse(response);
}
