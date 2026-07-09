import { Request, Response, NextFunction } from 'express';
import { stackService } from '../services/stack.service.js';
import { stackDeploySchema, stackScaleSchema } from '../validators/stack.validator.js';
import { ValidationError } from '../utils/errors.js';
import { ApiResponse } from '@dockverse/types';

function createSuccessResponse<T>(data: T, message: string): ApiResponse<T> {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    message,
    data,
  };
}

export async function listStacks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await stackService.listStacks();
    res.json(createSuccessResponse(list, 'Stacks listed successfully'));
  } catch (error) {
    next(error);
  }
}

export async function inspectStack(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const details = await stackService.inspectStack(req.params.name);
    res.json(createSuccessResponse(details, 'Stack details inspected successfully'));
  } catch (error) {
    next(error);
  }
}

export async function deployStack(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = stackDeploySchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const operationId = stackService.deployStackAsync(parseResult.data);
    res.status(202).json(createSuccessResponse({ operationId }, 'Stack deployment initiated'));
  } catch (error) {
    next(error);
  }
}

export async function scaleStackService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = stackScaleSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const operationId = stackService.scaleStackServiceAsync(parseResult.data);
    res.status(202).json(createSuccessResponse({ operationId }, 'Stack service scaling initiated'));
  } catch (error) {
    next(error);
  }
}

export async function removeStack(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const operationId = stackService.removeStackAsync(req.params.name);
    res.status(202).json(createSuccessResponse({ operationId }, 'Stack removal initiated'));
  } catch (error) {
    next(error);
  }
}

export async function getDashboardSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const summary = await stackService.getDashboardSummary();
    res.json(createSuccessResponse(summary, 'Stack dashboard summary retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getOperationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = stackService.getOperation(req.params.operationId);
    res.json(createSuccessResponse(status, 'Operation status retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getOperationsHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const history = stackService.getOperationsHistory();
    res.json(createSuccessResponse(history, 'Operations history retrieved successfully'));
  } catch (error) {
    next(error);
  }
}
