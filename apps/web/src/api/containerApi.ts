import type { ApiResponse, ContainerListItem, ContainerDetails } from '@dockverse/types';
import APP_CONFIG from '../lib/config';

export async function fetchContainers(): Promise<ContainerListItem[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/containers`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch containers' }));
    throw new Error(errorData.message || 'Failed to fetch containers');
  }
  const result: ApiResponse<ContainerListItem[]> = await response.json();
  return result.data;
}

export async function fetchContainerById(id: string): Promise<ContainerDetails> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/containers/${id}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to inspect container' }));
    throw new Error(errorData.message || 'Failed to inspect container');
  }
  const result: ApiResponse<ContainerDetails> = await response.json();
  return result.data;
}

export async function createContainer(input: { name?: string; image: string; cmd?: string; ports?: Array<{ hostPort: number; containerPort: number }>; env?: string[] }): Promise<{ id: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/containers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to create container' }));
    throw new Error(errorData.message || 'Failed to create container');
  }
  const result: ApiResponse<{ id: string }> = await response.json();
  return result.data;
}

export async function startContainer(id: string): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/containers/${id}/start`, { method: 'POST' });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to start container' }));
    throw new Error(errorData.message || 'Failed to start container');
  }
}

export async function stopContainer(id: string): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/containers/${id}/stop`, { method: 'POST' });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to stop container' }));
    throw new Error(errorData.message || 'Failed to stop container');
  }
}

export async function restartContainer(id: string): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/containers/${id}/restart`, { method: 'POST' });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to restart container' }));
    throw new Error(errorData.message || 'Failed to restart container');
  }
}

export async function pauseContainer(id: string): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/containers/${id}/pause`, { method: 'POST' });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to pause container' }));
    throw new Error(errorData.message || 'Failed to pause container');
  }
}

export async function unpauseContainer(id: string): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/containers/${id}/unpause`, { method: 'POST' });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to unpause container' }));
    throw new Error(errorData.message || 'Failed to unpause container');
  }
}

export async function killContainer(id: string): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/containers/${id}/kill`, { method: 'POST' });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to kill container' }));
    throw new Error(errorData.message || 'Failed to kill container');
  }
}

export async function removeContainer(id: string, force: boolean = false): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/containers/${id}?force=${force}`, { method: 'DELETE' });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to remove container' }));
    throw new Error(errorData.message || 'Failed to remove container');
  }
}

export async function renameContainer(id: string, name: string): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/containers/${id}/rename`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to rename container' }));
    throw new Error(errorData.message || 'Failed to rename container');
  }
}

export async function fetchContainerLogs(id: string, tail: number = 100): Promise<string[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/containers/${id}/logs?tail=${tail}&timestamps=true`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch container logs' }));
    throw new Error(errorData.message || 'Failed to fetch container logs');
  }
  const result: ApiResponse<string[]> = await response.json();
  return result.data;
}
