import { Request, Response, NextFunction } from 'express';
import { securityService } from '../services/security.service.js';
import { securityScanSchema, securityScheduleSchema } from '../validators/security.validator.js';
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

export async function getDashboardSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const summary = await securityService.getDashboardSummary();
    res.json(createSuccessResponse(summary, 'Dashboard summary retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function listFindings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = securityService.listFindings(req.query.targetId as string);
    res.json(createSuccessResponse(list, 'Findings listed successfully'));
  } catch (error) {
    next(error);
  }
}

export async function ignoreFinding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    securityService.ignoreFinding(req.params.id);
    res.json(createSuccessResponse(null, 'Finding ignored successfully'));
  } catch (error) {
    next(error);
  }
}

export async function triggerScan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = securityScanSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const operationId = securityService.triggerScanAsync(
      parseResult.data.targetType,
      parseResult.data.targetId,
      parseResult.data.category
    );
    res.status(202).json(createSuccessResponse({ operationId }, 'Security audit scan initiated'));
  } catch (error) {
    next(error);
  }
}

export async function listSchedules(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = securityService.listSchedules();
    res.json(createSuccessResponse(list, 'Scan schedules listed successfully'));
  } catch (error) {
    next(error);
  }
}

export async function createSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = securityScheduleSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const schedule = securityService.createSchedule(parseResult.data);
    res.status(201).json(createSuccessResponse(schedule, 'Scan schedule created successfully'));
  } catch (error) {
    next(error);
  }
}

export async function deleteSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    securityService.deleteSchedule(req.params.id);
    res.json(createSuccessResponse(null, 'Scan schedule deleted successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getOperationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = securityService.getOperation(req.params.operationId);
    res.json(createSuccessResponse(status, 'Operation status retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getOperationsHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const history = securityService.getOperationsHistory();
    res.json(createSuccessResponse(history, 'Operations history retrieved successfully'));
  } catch (error) {
    next(error);
  }
}
