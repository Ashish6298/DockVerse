import type {
  ApiResponse,
  SwarmClusterInfo,
  SwarmNodeInfo,
  SwarmJoinRequest,
  SwarmInitRequest,
  SwarmLeaveRequest,
  SwarmTokenInfo,
  SwarmOperationStatus,
  SwarmServiceInfo,
  SwarmTaskInfo,
  SwarmClusterHealth,
  SwarmSpecUpdateRequest,
  SwarmUnlockKeyInfo
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

export async function fetchSwarmStatus(): Promise<{ active: boolean; info: SwarmClusterInfo | null }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/swarm`);
  return handleResponse(response);
}

export async function fetchSwarmInspect(): Promise<SwarmClusterInfo> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/swarm/inspect`);
  return handleResponse(response);
}

export async function initSwarm(input: SwarmInitRequest): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/swarm/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse(response);
}

export async function joinSwarm(input: SwarmJoinRequest): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/swarm/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse(response);
}

export async function leaveSwarm(input: SwarmLeaveRequest): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/swarm/leave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse(response);
}

export async function fetchSwarmTokens(): Promise<SwarmTokenInfo> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/swarm/tokens`);
  return handleResponse(response);
}

export async function rotateSwarmTokens(role: 'manager' | 'worker'): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/swarm/tokens/rotate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  return handleResponse(response);
}

export async function fetchSwarmUnlockKey(): Promise<SwarmUnlockKeyInfo> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/swarm/unlockkey`);
  return handleResponse(response);
}

export async function updateSwarmSpec(input: SwarmSpecUpdateRequest): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/swarm/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse(response);
}

export async function fetchSwarmNodes(): Promise<SwarmNodeInfo[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/swarm/nodes`);
  return handleResponse(response);
}

export async function fetchSwarmNode(id: string): Promise<SwarmNodeInfo> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/swarm/nodes/${id}`);
  return handleResponse(response);
}

export async function promoteNode(id: string): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/swarm/nodes/${id}/promote`, {
    method: 'POST',
  });
  return handleResponse(response);
}

export async function demoteNode(id: string): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/swarm/nodes/${id}/demote`, {
    method: 'POST',
  });
  return handleResponse(response);
}

export async function drainNode(id: string): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/swarm/nodes/${id}/drain`, {
    method: 'POST',
  });
  return handleResponse(response);
}

export async function activateNode(id: string): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/swarm/nodes/${id}/activate`, {
    method: 'POST',
  });
  return handleResponse(response);
}

export async function pauseNode(id: string): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/swarm/nodes/${id}/pause`, {
    method: 'POST',
  });
  return handleResponse(response);
}

export async function removeNode(id: string, force = false): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/swarm/nodes/${id}?force=${force}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}

export async function fetchSwarmServices(): Promise<SwarmServiceInfo[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/swarm/services`);
  return handleResponse(response);
}

export async function fetchSwarmService(id: string): Promise<SwarmServiceInfo> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/swarm/services/${id}`);
  return handleResponse(response);
}

export async function fetchSwarmTasks(serviceId?: string): Promise<SwarmTaskInfo[]> {
  const url = serviceId
    ? `${APP_CONFIG.API_BASE_URL}/swarm/tasks?serviceId=${serviceId}`
    : `${APP_CONFIG.API_BASE_URL}/swarm/tasks`;
  const response = await fetch(url);
  return handleResponse(response);
}

export async function fetchSwarmTask(id: string): Promise<SwarmTaskInfo> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/swarm/tasks/${id}`);
  return handleResponse(response);
}

export async function fetchClusterHealth(): Promise<SwarmClusterHealth> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/swarm/health`);
  return handleResponse(response);
}

export async function fetchOperationsHistory(): Promise<SwarmOperationStatus[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/swarm/operations`);
  return handleResponse(response);
}

export async function fetchOperationStatus(operationId: string): Promise<SwarmOperationStatus> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/swarm/operations/${operationId}`);
  return handleResponse(response);
}
