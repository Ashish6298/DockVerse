import type {
  ApiResponse,
  SecretInfo,
  ConfigInfo,
  SecretCreateRequest,
  ConfigCreateRequest,
  SecretUsageInfo,
  ConfigUsageInfo,
  SecretOperationStatus,
  ConfigOperationStatus,
  SecretsDashboardSummary
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

export async function fetchDashboardSummary(): Promise<SecretsDashboardSummary> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/resources/dashboard`);
  return handleResponse(response);
}

export async function fetchSecrets(): Promise<SecretInfo[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/resources/secrets`);
  return handleResponse(response);
}

export async function fetchSecret(id: string): Promise<SecretInfo> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/resources/secrets/${id}`);
  return handleResponse(response);
}

export async function fetchSecretUsage(id: string): Promise<SecretUsageInfo> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/resources/secrets/${id}/usage`);
  return handleResponse(response);
}

export async function createSecret(input: SecretCreateRequest): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/resources/secrets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse(response);
}

export async function removeSecret(id: string, force = false): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/resources/secrets/${id}?force=${force}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}

export async function fetchConfigs(): Promise<ConfigInfo[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/resources/configs`);
  return handleResponse(response);
}

export async function fetchConfig(id: string): Promise<ConfigInfo> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/resources/configs/${id}`);
  return handleResponse(response);
}

export async function fetchConfigUsage(id: string): Promise<ConfigUsageInfo> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/resources/configs/${id}/usage`);
  return handleResponse(response);
}

export async function createConfig(input: ConfigCreateRequest): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/resources/configs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse(response);
}

export async function removeConfig(id: string, force = false): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/resources/configs/${id}?force=${force}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}

export async function fetchOperationsHistory(): Promise<Array<SecretOperationStatus | ConfigOperationStatus>> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/resources/operations`);
  return handleResponse(response);
}

export async function fetchOperationStatus(operationId: string): Promise<SecretOperationStatus | ConfigOperationStatus> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/resources/operations/${operationId}`);
  return handleResponse(response);
}
