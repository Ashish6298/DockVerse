import { Request, Response, NextFunction } from 'express';
import { composeService } from '../services/compose.service.js';
import { validateComposeSchema, runComposeCommandSchema } from '../validators/compose.validator.js';
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

export function getTemplates(req: Request, res: Response, next: NextFunction): void {
  try {
    const templates = composeService.getTemplates();
    res.json(createSuccessResponse(templates, 'Compose templates retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export function validateCompose(req: Request, res: Response, next: NextFunction): void {
  try {
    const parseResult = validateComposeSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const result = composeService.validateCompose(parseResult.data.content);
    res.json(createSuccessResponse(result, 'Compose YAML validated successfully'));
  } catch (error) {
    next(error);
  }
}

export function analyzeCompose(req: Request, res: Response, next: NextFunction): void {
  try {
    const parseResult = validateComposeSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const analysis = composeService.analyzeCompose(parseResult.data.content);
    res.json(createSuccessResponse(analysis, 'Compose YAML analyzed successfully'));
  } catch (error) {
    next(error);
  }
}

export function runCommand(req: Request, res: Response, next: NextFunction): void {
  try {
    const action = req.query.action as 'up' | 'down' | 'restart' | 'build';
    if (!['up', 'down', 'restart', 'build'].includes(action)) {
      throw new ValidationError('Invalid compose action. Must be up, down, restart, or build');
    }

    const parseResult = runComposeCommandSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }

    const { projectName, content } = parseResult.data;
    const operationId = composeService.runComposeCommand(projectName, content, action);
    res.status(201).json(createSuccessResponse({ operationId }, 'Docker Compose operation task started successfully'));
  } catch (error) {
    next(error);
  }
}

export function getOperationProgress(req: Request, res: Response, next: NextFunction): void {
  try {
    const progress = composeService.getOperationProgress(req.params.operationId);
    res.json(createSuccessResponse(progress, 'Compose operation progress retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export function getOperationHistory(req: Request, res: Response, next: NextFunction): void {
  try {
    const history = composeService.getOperationHistory();
    res.json(createSuccessResponse(history, 'Compose operations history retrieved successfully'));
  } catch (error) {
    next(error);
  }
}
