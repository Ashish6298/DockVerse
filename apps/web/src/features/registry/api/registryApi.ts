import type { 
  ApiResponse, 
  RegistryProvider, 
  RegistryAuthentication, 
  RegistrySearchResult, 
  RegistryTag, 
  RegistryManifest, 
  RegistryOperation 
} from '@dockverse/types';
import APP_CONFIG from '../../../lib/config';

export async function fetchProviders(): Promise<RegistryProvider[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/registry/providers`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch providers' }));
    throw new Error(errorData.message || 'Failed to fetch providers');
  }
  const result: ApiResponse<RegistryProvider[]> = await response.json();
  return result.data;
}

export async function loginToRegistry(input: { providerId: string; username: string; password?: string }): Promise<RegistryAuthentication> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/registry/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      providerId: input.providerId,
      username: input.username,
      password: input.password || 'none'
    }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(errorData.message || 'Login failed');
  }
  const result: ApiResponse<RegistryAuthentication> = await response.json();
  return result.data;
}

export async function logoutFromRegistry(providerId: string): Promise<void> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/registry/logout/${providerId}`, {
    method: 'POST',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Logout failed' }));
    throw new Error(errorData.message || 'Logout failed');
  }
}

export async function fetchAuthStatus(providerId: string): Promise<RegistryAuthentication> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/registry/auth/${providerId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch auth status' }));
    throw new Error(errorData.message || 'Failed to fetch auth status');
  }
  const result: ApiResponse<RegistryAuthentication> = await response.json();
  return result.data;
}

export async function searchRegistry(query: string): Promise<RegistrySearchResult> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/registry/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Search failed' }));
    throw new Error(errorData.message || 'Search failed');
  }
  const result: ApiResponse<RegistrySearchResult> = await response.json();
  return result.data;
}

export async function fetchTags(repository: string): Promise<RegistryTag[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/registry/tags?repository=${repository}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch tags' }));
    throw new Error(errorData.message || 'Failed to fetch tags');
  }
  const result: ApiResponse<RegistryTag[]> = await response.json();
  return result.data;
}

export async function fetchManifest(repository: string, tag: string): Promise<RegistryManifest> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/registry/manifest?repository=${repository}&tag=${tag}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch manifest' }));
    throw new Error(errorData.message || 'Failed to fetch manifest');
  }
  const result: ApiResponse<RegistryManifest> = await response.json();
  return result.data;
}

export async function pullRegistryImage(input: { imageName: string; tag?: string }): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/registry/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Pull request failed' }));
    throw new Error(errorData.message || 'Pull request failed');
  }
  const result: ApiResponse<{ operationId: string }> = await response.json();
  return result.data;
}

export async function pushRegistryImage(input: { imageName: string; tag?: string }): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/registry/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Push request failed' }));
    throw new Error(errorData.message || 'Push request failed');
  }
  const result: ApiResponse<{ operationId: string }> = await response.json();
  return result.data;
}

export async function fetchOperationProgress(operationId: string): Promise<RegistryOperation> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/registry/operation/${operationId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch operation progress' }));
    throw new Error(errorData.message || 'Failed to fetch operation progress');
  }
  const result: ApiResponse<RegistryOperation> = await response.json();
  return result.data;
}
