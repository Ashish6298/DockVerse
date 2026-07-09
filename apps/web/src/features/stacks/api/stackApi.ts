import type {
  ApiResponse,
  StackInfo,
  StackInspectResponse,
  StackDeploymentRequest,
  StackScaleRequest,
  StackOperationStatus,
  StackDashboardSummary
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

export async function fetchDashboardSummary(): Promise<StackDashboardSummary> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/stacks/dashboard`);
  return handleResponse(response);
}

export async function fetchStacks(): Promise<StackInfo[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/stacks`);
  return handleResponse(response);
}

export async function fetchStack(name: string): Promise<StackInspectResponse> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/stacks/${name}`);
  return handleResponse(response);
}

export async function deployStack(input: StackDeploymentRequest): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/stacks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse(response);
}

export async function scaleStackService(input: StackScaleRequest): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/stacks/scale`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse(response);
}

export async function removeStack(name: string): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/stacks/${name}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}

export async function fetchOperationsHistory(): Promise<StackOperationStatus[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/stacks/operations`);
  return handleResponse(response);
}

export async function fetchOperationStatus(operationId: string): Promise<StackOperationStatus> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/stacks/operations/${operationId}`);
  return handleResponse(response);
}
