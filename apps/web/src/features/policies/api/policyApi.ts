import type {
  ApiResponse,
  PolicyInfo,
  PolicyFinding,
  PolicyScanSchedule,
  PolicyDashboardSummary,
  PolicyOperationStatus
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

export async function fetchDashboardSummary(): Promise<PolicyDashboardSummary> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/policies/dashboard`);
  return handleResponse(response);
}

export async function fetchPolicies(): Promise<PolicyInfo[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/policies`);
  return handleResponse(response);
}

export async function createPolicy(input: Omit<PolicyInfo, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<PolicyInfo> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/policies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse(response);
}

export async function updatePolicy(id: string, input: Partial<PolicyInfo>): Promise<PolicyInfo> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/policies/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse(response);
}

export async function deletePolicy(id: string): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/policies/${id}`, {
    method: 'DELETE',
  });
  await handleResponse(response);
}

export async function triggerScan(): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/policies/scan`, {
    method: 'POST',
  });
  return handleResponse(response);
}

export async function fetchFindings(): Promise<PolicyFinding[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/policies/findings`);
  return handleResponse(response);
}

export async function acknowledgeFinding(id: string, justification?: string): Promise<PolicyFinding> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/policies/findings/${id}/acknowledge`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ justification }),
  });
  return handleResponse(response);
}

export async function ignoreFinding(id: string, justification?: string): Promise<PolicyFinding> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/policies/findings/${id}/ignore`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ justification }),
  });
  return handleResponse(response);
}

export async function resolveFinding(id: string): Promise<PolicyFinding> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/policies/findings/${id}/resolve`, {
    method: 'PATCH',
  });
  return handleResponse(response);
}

export async function triggerExport(format: 'json' | 'csv'): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/policies/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format }),
  });
  return handleResponse(response);
}

export async function fetchSchedules(): Promise<PolicyScanSchedule[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/policies/schedules`);
  return handleResponse(response);
}

export async function createSchedule(input: Omit<PolicyScanSchedule, 'id'>): Promise<PolicyScanSchedule> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/policies/schedules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse(response);
}

export async function deleteSchedule(id: string): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/policies/schedules/${id}`, {
    method: 'DELETE',
  });
  await handleResponse(response);
}

export async function fetchOperationsHistory(): Promise<PolicyOperationStatus[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/policies/operations`);
  return handleResponse(response);
}

export async function fetchOperationStatus(operationId: string): Promise<PolicyOperationStatus> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/policies/operations/${operationId}`);
  return handleResponse(response);
}
