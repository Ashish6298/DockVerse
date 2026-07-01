import type { ApiResponse, ImageListItem, ImageDetails, ImageHistoryItem } from '@dockverse/types';
import APP_CONFIG from '../lib/config';

export async function fetchImages(): Promise<ImageListItem[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/images`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch images' }));
    throw new Error(errorData.message || 'Failed to fetch images');
  }
  const result: ApiResponse<ImageListItem[]> = await response.json();
  return result.data;
}

export async function fetchImageById(id: string): Promise<ImageDetails> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/images/${id}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to inspect image' }));
    throw new Error(errorData.message || 'Failed to inspect image');
  }
  const result: ApiResponse<ImageDetails> = await response.json();
  return result.data;
}

export async function pullImage(input: { fromImage: string; tag?: string }): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/images/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to pull image' }));
    throw new Error(errorData.message || 'Failed to pull image');
  }
}

export async function deleteImage(id: string, force: boolean = false): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/images/${id}?force=${force}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to delete image' }));
    throw new Error(errorData.message || 'Failed to delete image');
  }
}

export async function tagImage(id: string, input: { repo: string; tag?: string }): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/images/${id}/tag`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to tag image' }));
    throw new Error(errorData.message || 'Failed to tag image');
  }
}

export async function fetchImageHistory(id: string): Promise<ImageHistoryItem[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/images/${id}/history`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch image history' }));
    throw new Error(errorData.message || 'Failed to fetch image history');
  }
  const result: ApiResponse<ImageHistoryItem[]> = await response.json();
  return result.data;
}

export async function pruneImages(): Promise<{ spaceReclaimed: number }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/images/prune`, {
    method: 'POST',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to prune images' }));
    throw new Error(errorData.message || 'Failed to prune images');
  }
  const result: ApiResponse<{ spaceReclaimed: number }> = await response.json();
  return result.data;
}
