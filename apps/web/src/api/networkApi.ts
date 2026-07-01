import type { ApiResponse, NetworkListItem, NetworkDetails } from '@dockverse/types';
import APP_CONFIG from '../lib/config';

export async function fetchNetworks(): Promise<NetworkListItem[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/networks`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch networks' }));
    throw new Error(errorData.message || 'Failed to fetch networks');
  }
  const result: ApiResponse<NetworkListItem[]> = await response.json();
  return result.data;
}

export async function fetchNetworkById(id: string): Promise<NetworkDetails> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/networks/${id}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to inspect network' }));
    throw new Error(errorData.message || 'Failed to inspect network');
  }
  const result: ApiResponse<NetworkDetails> = await response.json();
  return result.data;
}

export async function createNetwork(input: { name: string; driver?: string; attachable?: boolean; internal?: boolean; enableIPv6?: boolean; subnet?: string; gateway?: string }): Promise<{ id: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/networks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to create network' }));
    throw new Error(errorData.message || 'Failed to create network');
  }
  const result: ApiResponse<{ id: string }> = await response.json();
  return result.data;
}

export async function deleteNetwork(id: string): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/networks/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to delete network' }));
    throw new Error(errorData.message || 'Failed to delete network');
  }
}

export async function connectContainer(networkId: string, containerId: string): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/networks/${networkId}/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ container: containerId }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to connect container' }));
    throw new Error(errorData.message || 'Failed to connect container');
  }
}

export async function disconnectContainer(networkId: string, containerId: string, force: boolean = false): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/networks/${networkId}/disconnect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ container: containerId, force }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to disconnect container' }));
    throw new Error(errorData.message || 'Failed to disconnect container');
  }
}

export async function pruneNetworks(): Promise<{ spaceReclaimed: number }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/networks/prune`, {
    method: 'POST',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to prune networks' }));
    throw new Error(errorData.message || 'Failed to prune networks');
  }
  const result: ApiResponse<{ spaceReclaimed: number }> = await response.json();
  return result.data;
}
