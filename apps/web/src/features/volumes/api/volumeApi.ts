import type { ApiResponse, VolumeSummary, VolumeDetails, VolumeCreateRequest, VolumeCreateResponse, VolumePruneResponse } from '@dockverse/types';
import APP_CONFIG from '../../../lib/config';

export async function fetchVolumes(): Promise<VolumeSummary[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/volumes`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch volumes' }));
    throw new Error(errorData.message || 'Failed to fetch volumes');
  }
  const result: ApiResponse<VolumeSummary[]> = await response.json();
  return result.data;
}

export async function fetchVolumeByName(name: string): Promise<VolumeDetails> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/volumes/${name}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to inspect volume' }));
    throw new Error(errorData.message || 'Failed to inspect volume');
  }
  const result: ApiResponse<VolumeDetails> = await response.json();
  return result.data;
}

export async function createVolume(input: VolumeCreateRequest): Promise<VolumeCreateResponse> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/volumes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to create volume' }));
    throw new Error(errorData.message || 'Failed to create volume');
  }
  const result: ApiResponse<VolumeCreateResponse> = await response.json();
  return result.data;
}

export async function deleteVolume(name: string): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/volumes/${name}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to delete volume' }));
    throw new Error(errorData.message || 'Failed to delete volume');
  }
}

export async function pruneVolumes(): Promise<VolumePruneResponse> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/volumes/prune`, {
    method: 'POST',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to prune volumes' }));
    throw new Error(errorData.message || 'Failed to prune volumes');
  }
  const result: ApiResponse<VolumePruneResponse> = await response.json();
  return result.data;
}
