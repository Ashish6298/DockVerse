import { Request, Response, NextFunction } from 'express';
import { workspaceService } from '../services/workspace.service.js';
import { createWorkspaceSchema, updateWorkspaceSchema } from '../validators/workspace.validator.js';
import { ApiResponse } from '@dockverse/types';
import { ValidationError } from '../utils/errors.js';

function createSuccessResponse<T>(data: T, message: string): ApiResponse<T> {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    message,
    data,
  };
}

export async function listWorkspaces(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await workspaceService.listWorkspaces();
    res.json(createSuccessResponse(list, 'Workspaces listed successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const workspace = await workspaceService.getWorkspaceById(req.params.id);
    res.json(createSuccessResponse(workspace, 'Workspace retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function createWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = createWorkspaceSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map(i => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const created = await workspaceService.createWorkspace(parseResult.data);
    res.status(201).json(createSuccessResponse(created, 'Workspace created successfully'));
  } catch (error) {
    next(error);
  }
}

export async function updateWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = updateWorkspaceSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map(i => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const updated = await workspaceService.updateWorkspace(req.params.id, parseResult.data);
    res.json(createSuccessResponse(updated, 'Workspace updated successfully'));
  } catch (error) {
    next(error);
  }
}

export async function deleteWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const deleted = await workspaceService.deleteWorkspace(req.params.id);
    res.json(createSuccessResponse(deleted, 'Workspace deleted successfully'));
  } catch (error) {
    next(error);
  }
}
