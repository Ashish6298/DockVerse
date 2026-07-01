import { Request, Response, NextFunction } from 'express';
import { registryService } from './registry.service.js';
import { registryLoginSchema, registrySearchSchema, registryPullPushSchema } from './registry.validator.js';
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

export function getProviders(req: Request, res: Response, next: NextFunction): void {
  try {
    const providers = registryService.getProviders();
    res.json(createSuccessResponse(providers, 'Registry providers list retrieved'));
  } catch (error) {
    next(error);
  }
}

export function login(req: Request, res: Response, next: NextFunction): void {
  try {
    const parseResult = registryLoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map(i => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const { providerId, username, password } = parseResult.data;
    const session = registryService.login(providerId, username, password);
    res.json(createSuccessResponse(session, 'Successfully logged in to registry provider'));
  } catch (error) {
    next(error);
  }
}

export function logout(req: Request, res: Response, next: NextFunction): void {
  try {
    const providerId = req.params.providerId;
    registryService.logout(providerId);
    res.json(createSuccessResponse(null, 'Successfully logged out from registry provider'));
  } catch (error) {
    next(error);
  }
}

export function getAuthStatus(req: Request, res: Response, next: NextFunction): void {
  try {
    const providerId = req.params.providerId;
    const status = registryService.getAuthStatus(providerId);
    res.json(createSuccessResponse(status, 'Registry connection authorization state retrieved'));
  } catch (error) {
    next(error);
  }
}

export function searchRepositories(req: Request, res: Response, next: NextFunction): void {
  try {
    const parseResult = registrySearchSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map(i => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const result = registryService.searchRepositories(parseResult.data.query);
    res.json(createSuccessResponse(result, 'Registry search completed successfully'));
  } catch (error) {
    next(error);
  }
}

export function getTags(req: Request, res: Response, next: NextFunction): void {
  try {
    const repo = req.query.repository as string;
    if (!repo) {
      throw new ValidationError('Repository query parameter is required');
    }
    const tags = registryService.getTags(repo);
    res.json(createSuccessResponse(tags, 'Repository tags list retrieved'));
  } catch (error) {
    next(error);
  }
}

export function getManifest(req: Request, res: Response, next: NextFunction): void {
  try {
    const repo = req.query.repository as string;
    const tag = req.query.tag as string;
    if (!repo || !tag) {
      throw new ValidationError('Repository and tag query parameters are required');
    }
    const manifest = registryService.getManifest(repo, tag);
    res.json(createSuccessResponse(manifest, 'Registry image manifest retrieved'));
  } catch (error) {
    next(error);
  }
}

export function startPull(req: Request, res: Response, next: NextFunction): void {
  try {
    const parseResult = registryPullPushSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map(i => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const { imageName, tag } = parseResult.data;
    const operationId = registryService.startPull(imageName, tag || 'latest');
    res.status(201).json(createSuccessResponse({ operationId }, 'Registry pull task spawned successfully'));
  } catch (error) {
    next(error);
  }
}

export function startPush(req: Request, res: Response, next: NextFunction): void {
  try {
    const parseResult = registryPullPushSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map(i => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const { imageName, tag } = parseResult.data;
    const operationId = registryService.startPush(imageName, tag || 'latest');
    res.status(201).json(createSuccessResponse({ operationId }, 'Registry push task spawned successfully'));
  } catch (error) {
    next(error);
  }
}

export function getOperationProgress(req: Request, res: Response, next: NextFunction): void {
  try {
    const progress = registryService.getOperationProgress(req.params.operationId);
    res.json(createSuccessResponse(progress, 'Registry operation task progress retrieved'));
  } catch (error) {
    next(error);
  }
}

export function getRateLimit(req: Request, res: Response, next: NextFunction): void {
  try {
    const limit = registryService.getRateLimit();
    res.json(createSuccessResponse(limit, 'Registry rate limit stats retrieved'));
  } catch (error) {
    next(error);
  }
}

export function getHealth(req: Request, res: Response, next: NextFunction): void {
  try {
    const health = registryService.getHealth();
    res.json(createSuccessResponse(health, 'Registry health telemetry state retrieved'));
  } catch (error) {
    next(error);
  }
}
