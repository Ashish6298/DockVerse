import { Request, Response, NextFunction } from 'express';
import { resourceService } from '../services/resource.service.js';
import { secretCreateSchema, configCreateSchema } from '../validators/resource.validator.js';
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

export async function listSecrets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await resourceService.listSecrets();
    res.json(createSuccessResponse(list, 'Secrets retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function inspectSecret(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const details = await resourceService.inspectSecret(req.params.id);
    res.json(createSuccessResponse(details, 'Secret details retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function checkSecretUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const usage = await resourceService.checkSecretUsage(req.params.id);
    res.json(createSuccessResponse(usage, 'Secret usage verified successfully'));
  } catch (error) {
    next(error);
  }
}

export async function createSecret(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = secretCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const operationId = resourceService.createSecretAsync(parseResult.data);
    res.status(202).json(createSuccessResponse({ operationId }, 'Secret creation initiated'));
  } catch (error) {
    next(error);
  }
}

export async function removeSecret(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const force = req.query.force === 'true';
    const operationId = resourceService.removeSecretAsync(req.params.id, force);
    res.status(202).json(createSuccessResponse({ operationId }, 'Secret removal initiated'));
  } catch (error) {
    next(error);
  }
}

export async function listConfigs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await resourceService.listConfigs();
    res.json(createSuccessResponse(list, 'Configs retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function inspectConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const details = await resourceService.inspectConfig(req.params.id);
    res.json(createSuccessResponse(details, 'Config details retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function checkConfigUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const usage = await resourceService.checkConfigUsage(req.params.id);
    res.json(createSuccessResponse(usage, 'Config usage verified successfully'));
  } catch (error) {
    next(error);
  }
}

export async function createConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = configCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const operationId = resourceService.createConfigAsync(parseResult.data);
    res.status(202).json(createSuccessResponse({ operationId }, 'Config creation initiated'));
  } catch (error) {
    next(error);
  }
}

export async function removeConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const force = req.query.force === 'true';
    const operationId = resourceService.removeConfigAsync(req.params.id, force);
    res.status(202).json(createSuccessResponse({ operationId }, 'Config removal initiated'));
  } catch (error) {
    next(error);
  }
}

export async function getDashboardSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const summary = await resourceService.getDashboardSummary();
    res.json(createSuccessResponse(summary, 'Dashboard summary retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getOperationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = resourceService.getOperation(req.params.operationId);
    res.json(createSuccessResponse(status, 'Operation status retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getOperationsHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const history = resourceService.getOperationsHistory();
    res.json(createSuccessResponse(history, 'Operations history retrieved successfully'));
  } catch (error) {
    next(error);
  }
}
