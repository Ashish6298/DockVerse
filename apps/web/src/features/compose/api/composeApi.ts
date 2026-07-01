import type { 
  ApiResponse, 
  DockerfileTemplate, 
  ComposeValidationResult, 
  ComposeProjectDetails, 
  ComposeOperationResponse
} from '@dockverse/types';
import APP_CONFIG from '../../../lib/config';

export async function fetchTemplates(): Promise<DockerfileTemplate[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/compose/templates`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch templates' }));
    throw new Error(errorData.message || 'Failed to fetch templates');
  }
  const result: ApiResponse<DockerfileTemplate[]> = await response.json();
  return result.data;
}

export async function validateCompose(content: string): Promise<ComposeValidationResult> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/compose/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Validation failed' }));
    throw new Error(errorData.message || 'Validation failed');
  }
  const result: ApiResponse<ComposeValidationResult> = await response.json();
  return result.data;
}

export async function analyzeCompose(content: string): Promise<ComposeProjectDetails> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/compose/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Analysis failed' }));
    throw new Error(errorData.message || 'Analysis failed');
  }
  const result: ApiResponse<ComposeProjectDetails> = await response.json();
  return result.data;
}

export async function runComposeCommand(input: { projectName: string; content: string; action: 'up' | 'down' | 'restart' | 'build' }): Promise<{ operationId: string }> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/compose/run?action=${input.action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectName: input.projectName,
      content: input.content
    }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Command execution failed' }));
    throw new Error(errorData.message || 'Command execution failed');
  }
  const result: ApiResponse<{ operationId: string }> = await response.json();
  return result.data;
}

export async function fetchOperationProgress(operationId: string): Promise<ComposeOperationResponse> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/compose/operation/${operationId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch operation progress' }));
    throw new Error(errorData.message || 'Failed to fetch operation progress');
  }
  const result: ApiResponse<ComposeOperationResponse> = await response.json();
  return result.data;
}

export async function fetchOperationHistory(): Promise<ComposeOperationResponse[]> {
  const response = await fetch(`${APP_CONFIG.API_BASE_URL}/compose/history`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch operations history' }));
    throw new Error(errorData.message || 'Failed to fetch operations history');
  }
  const result: ApiResponse<ComposeOperationResponse[]> = await response.json();
  return result.data;
}
