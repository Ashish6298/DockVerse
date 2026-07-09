import type {
  ApiResponse,
  DockerHostInfo,
  HostDashboardSummary,
  HostOperationStatus
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

export async function fetchDashboardSummary(): Promise<HostDashboardSummary> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/hosts/dashboard`);
  return handleResponse(response);
}

export async function fetchHosts(): Promise<DockerHostInfo[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/hosts`);
  return handleResponse(response);
}

export async function createHost(input: Omit<DockerHostInfo, 'id' | 'status' | 'latency' | 'lastSync' | 'cpuCount' | 'memory' | 'favorite' | 'archived'>): Promise<DockerHostInfo> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/hosts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse(response);
}

export async function updateHost(id: string, input: Partial<DockerHostInfo>): Promise<DockerHostInfo> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/hosts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse(response);
}

export async function deleteHost(id: string): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/hosts/${id}`, {
    method: 'DELETE',
  });
  await handleResponse(response);
}

export async function testConnection(id: string): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/hosts/${id}/test`, {
    method: 'POST',
  });
  return handleResponse(response);
}

export async function connectHost(id: string): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/hosts/${id}/connect`, {
    method: 'POST',
  });
  return handleResponse(response);
}

export async function disconnectHost(id: string): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/hosts/${id}/disconnect`, {
    method: 'POST',
  });
  return handleResponse(response);
}

export async function syncMetadata(id: string): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/hosts/${id}/sync`, {
    method: 'POST',
  });
  return handleResponse(response);
}

export async function triggerExport(format: 'json' | 'csv'): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/hosts/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format }),
  });
  return handleResponse(response);
}

export async function fetchOperationsHistory(): Promise<HostOperationStatus[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/hosts/operations`);
  return handleResponse(response);
}

export async function fetchOperationStatus(operationId: string): Promise<HostOperationStatus> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/hosts/operations/${operationId}`);
  return handleResponse(response);
}
