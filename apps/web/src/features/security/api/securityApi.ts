import type {
  ApiResponse,
  SecurityFinding,
  SecurityScanSchedule,
  SecurityDashboardSummary,
  SecurityOperationStatus
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

export async function fetchDashboardSummary(): Promise<SecurityDashboardSummary> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/security/dashboard`);
  return handleResponse(response);
}

export async function fetchFindings(targetId?: string): Promise<SecurityFinding[]> {
  const url = targetId
    ? `${APP_CONFIG.API_BASE_URL}/security/findings?targetId=${targetId}`
    : `${APP_CONFIG.API_BASE_URL}/security/findings`;
  const response = await fetch(url);
  return handleResponse(response);
}

export async function ignoreFinding(id: string): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/security/findings/${id}`, {
    method: 'DELETE',
  });
  await handleResponse(response);
}

export async function triggerScan(input: { targetType: 'container' | 'image' | 'system'; targetId: string; category: string }): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/security/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse(response);
}

export async function fetchSchedules(): Promise<SecurityScanSchedule[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/security/schedules`);
  return handleResponse(response);
}

export async function createSchedule(input: Omit<SecurityScanSchedule, 'id'>): Promise<SecurityScanSchedule> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/security/schedules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse(response);
}

export async function deleteSchedule(id: string): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/security/schedules/${id}`, {
    method: 'DELETE',
  });
  await handleResponse(response);
}

export async function fetchOperationsHistory(): Promise<SecurityOperationStatus[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/security/operations`);
  return handleResponse(response);
}

export async function fetchOperationStatus(operationId: string): Promise<SecurityOperationStatus> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/security/operations/${operationId}`);
  return handleResponse(response);
}
