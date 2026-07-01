import type { ApiResponse, Workspace } from '@dockverse/types';
import APP_CONFIG from '../lib/config';

export async function fetchWorkspaces(): Promise<Workspace[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/workspaces`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch workspaces' }));
    throw new Error(errorData.message || 'Failed to fetch workspaces');
  }
  const result: ApiResponse<Workspace[]> = await response.json();
  return result.data;
}

export async function fetchWorkspaceById(id: string): Promise<Workspace> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/workspaces/${id}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch workspace' }));
    throw new Error(errorData.message || 'Failed to fetch workspace');
  }
  const result: ApiResponse<Workspace> = await response.json();
  return result.data;
}

export async function createWorkspace(input: Omit<Workspace, '_id' | 'createdAt' | 'updatedAt'>): Promise<Workspace> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/workspaces`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to create workspace' }));
    throw new Error(errorData.message || 'Failed to create workspace');
  }
  const result: ApiResponse<Workspace> = await response.json();
  return result.data;
}

export async function updateWorkspace(id: string, input: Partial<Omit<Workspace, '_id' | 'createdAt' | 'updatedAt'>>): Promise<Workspace> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/workspaces/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to update workspace' }));
    throw new Error(errorData.message || 'Failed to update workspace');
  }
  const result: ApiResponse<Workspace> = await response.json();
  return result.data;
}

export async function deleteWorkspace(id: string): Promise<Workspace> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/workspaces/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to delete workspace' }));
    throw new Error(errorData.message || 'Failed to delete workspace');
  }
  const result: ApiResponse<Workspace> = await response.json();
  return result.data;
}
