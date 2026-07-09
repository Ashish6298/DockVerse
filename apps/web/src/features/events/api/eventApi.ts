import type {
  ApiResponse,
  DockerEventInfo,
  AuditEventSchedule,
  EventDashboardSummary,
  EventOperationStatus
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

export async function fetchDashboardSummary(): Promise<EventDashboardSummary> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/events/dashboard`);
  return handleResponse(response);
}

export async function fetchEvents(filters: { severity?: string; resourceType?: string; searchTerm?: string } = {}): Promise<DockerEventInfo[]> {
  const params = new URLSearchParams();
  if (filters.severity) params.append('severity', filters.severity);
  if (filters.resourceType) params.append('resourceType', filters.resourceType);
  if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);

  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/events/logs?${params.toString()}`);
  return handleResponse(response);
}

export async function triggerExport(format: 'json' | 'csv'): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/events/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format }),
  });
  return handleResponse(response);
}

export async function triggerMaintenance(): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/events/maintenance`, {
    method: 'POST',
  });
  return handleResponse(response);
}

export async function fetchSchedules(): Promise<AuditEventSchedule[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/events/schedules`);
  return handleResponse(response);
}

export async function createSchedule(input: Omit<AuditEventSchedule, 'id'>): Promise<AuditEventSchedule> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/events/schedules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse(response);
}

export async function deleteSchedule(id: string): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/events/schedules/${id}`, {
    method: 'DELETE',
  });
  await handleResponse(response);
}

export async function fetchOperationsHistory(): Promise<EventOperationStatus[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/events/operations`);
  return handleResponse(response);
}

export async function fetchOperationStatus(operationId: string): Promise<EventOperationStatus> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/events/operations/${operationId}`);
  return handleResponse(response);
}
