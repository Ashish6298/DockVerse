import type { 
  ApiResponse, 
  DockerfileTemplate, 
  DockerfileValidationResult, 
  DockerfileAnalysis, 
  DockerBuildProgress,
  DockerBuildHistory
} from '@dockverse/types';
import APP_CONFIG from '../../../lib/config';

export async function fetchTemplates(): Promise<DockerfileTemplate[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/dockerfiles/templates`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch templates' }));
    throw new Error(errorData.message || 'Failed to fetch templates');
  }
  const result: ApiResponse<DockerfileTemplate[]> = await response.json();
  return result.data;
}

export async function validateDockerfile(content: string): Promise<DockerfileValidationResult> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/dockerfiles/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Validation failed' }));
    throw new Error(errorData.message || 'Validation failed');
  }
  const result: ApiResponse<DockerfileValidationResult> = await response.json();
  return result.data;
}

export async function analyzeDockerfile(content: string): Promise<DockerfileAnalysis> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/dockerfiles/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Analysis failed' }));
    throw new Error(errorData.message || 'Analysis failed');
  }
  const result: ApiResponse<DockerfileAnalysis> = await response.json();
  return result.data;
}

export async function startImageBuild(input: { name: string; tag?: string; content: string; buildArgs?: Record<string, string> }): Promise<{ buildId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/dockerfiles/build`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to start build' }));
    throw new Error(errorData.message || 'Failed to start build');
  }
  const result: ApiResponse<{ buildId: string }> = await response.json();
  return result.data;
}

export async function fetchBuildProgress(buildId: string): Promise<DockerBuildProgress> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/dockerfiles/build/${buildId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch build progress' }));
    throw new Error(errorData.message || 'Failed to fetch build progress');
  }
  const result: ApiResponse<DockerBuildProgress> = await response.json();
  return result.data;
}

export async function fetchBuildHistory(): Promise<DockerBuildHistory[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/dockerfiles/history`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch build history' }));
    throw new Error(errorData.message || 'Failed to fetch build history');
  }
  const result: ApiResponse<DockerBuildHistory[]> = await response.json();
  return result.data;
}
