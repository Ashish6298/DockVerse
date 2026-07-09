import type {
  ApiResponse,
  PluginListItem,
  PluginDetails,
  PluginPrivilege,
  PluginInstallRequest,
  PluginConfigureRequest,
  PluginOperationResponse
} from '@dockverse/types';
import APP_CONFIG from '../../../lib/config';

export async function fetchPlugins(): Promise<PluginListItem[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/plugins`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch plugins' }));
    throw new Error(errorData.message || 'Failed to fetch plugins');
  }
  const result: ApiResponse<PluginListItem[]> = await response.json();
  return result.data;
}

export async function fetchPluginDetails(id: string): Promise<PluginDetails> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/plugins/${id}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch plugin details' }));
    throw new Error(errorData.message || 'Failed to fetch plugin details');
  }
  const result: ApiResponse<PluginDetails> = await response.json();
  return result.data;
}

export async function fetchPluginPrivileges(remoteName: string): Promise<PluginPrivilege[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/plugins/privileges?remoteName=${encodeURIComponent(remoteName)}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch plugin privileges' }));
    throw new Error(errorData.message || 'Failed to fetch plugin privileges');
  }
  const result: ApiResponse<PluginPrivilege[]> = await response.json();
  return result.data;
}

export async function installPlugin(input: PluginInstallRequest): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/plugins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Plugin installation failed' }));
    throw new Error(errorData.message || 'Plugin installation failed');
  }
  const result: ApiResponse<{ operationId: string }> = await response.json();
  return result.data;
}

export async function enablePlugin(id: string): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/plugins/${id}/enable`, {
    method: 'POST',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to enable plugin' }));
    throw new Error(errorData.message || 'Failed to enable plugin');
  }
}

export async function disablePlugin(id: string, force = false): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/plugins/${id}/disable?force=${force}`, {
    method: 'POST',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to disable plugin' }));
    throw new Error(errorData.message || 'Failed to disable plugin');
  }
}

export async function configurePlugin(id: string, input: PluginConfigureRequest): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/plugins/${id}/configure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to configure plugin' }));
    throw new Error(errorData.message || 'Failed to configure plugin');
  }
}

export async function upgradePlugin(id: string, input: { remoteName: string; grantPrivileges: boolean }): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/plugins/${id}/upgrade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to upgrade plugin' }));
    throw new Error(errorData.message || 'Failed to upgrade plugin');
  }
  const result: ApiResponse<{ operationId: string }> = await response.json();
  return result.data;
}

export async function removePlugin(id: string, force = false): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/plugins/${id}?force=${force}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to uninstall plugin' }));
    throw new Error(errorData.message || 'Failed to uninstall plugin');
  }
}

export async function fetchPluginOperation(operationId: string): Promise<PluginOperationResponse> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/plugins/operations/${operationId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch operation progress' }));
    throw new Error(errorData.message || 'Failed to fetch operation progress');
  }
  const result: ApiResponse<PluginOperationResponse> = await response.json();
  return result.data;
}
