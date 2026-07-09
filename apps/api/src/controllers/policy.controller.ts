import { Request, Response, NextFunction } from 'express';
import { policyService } from '../services/policy.service.js';
import { policyCreateSchema, policyScheduleSchema } from '../validators/policy.validator.js';
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
    const summary = await policyService.getDashboardSummary();
    res.json(createSuccessResponse(summary, 'Dashboard summary retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function listPolicies(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = policyService.listPolicies();
    res.json(createSuccessResponse(list, 'Policies listed successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const policy = policyService.getPolicy(req.params.id);
    res.json(createSuccessResponse(policy, 'Policy retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function createPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = policyCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const policy = policyService.createPolicy(parseResult.data);
    res.status(201).json(createSuccessResponse(policy, 'Policy created successfully'));
  } catch (error) {
    next(error);
  }
}

export async function updatePolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const policy = policyService.updatePolicy(req.params.id, req.body);
    res.json(createSuccessResponse(policy, 'Policy updated successfully'));
  } catch (error) {
    next(error);
  }
}

export async function deletePolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    policyService.deletePolicy(req.params.id);
    res.json(createSuccessResponse(null, 'Policy deleted successfully'));
  } catch (error) {
    next(error);
  }
}

export async function triggerScan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const operationId = policyService.triggerScanAsync();
    res.status(202).json(createSuccessResponse({ operationId }, 'Policy compliance scan initiated'));
  } catch (error) {
    next(error);
  }
}

export async function listFindings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = policyService.listFindings();
    res.json(createSuccessResponse(list, 'Findings listed successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getFinding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const finding = policyService.getFinding(req.params.id);
    res.json(createSuccessResponse(finding, 'Finding retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function acknowledgeFinding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const finding = policyService.acknowledgeFinding(req.params.id, req.body.justification);
    res.json(createSuccessResponse(finding, 'Finding acknowledged successfully'));
  } catch (error) {
    next(error);
  }
}

export async function ignoreFinding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const finding = policyService.ignoreFinding(req.params.id, req.body.justification);
    res.json(createSuccessResponse(finding, 'Finding marked ignored successfully'));
  } catch (error) {
    next(error);
  }
}

export async function resolveFinding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const finding = policyService.resolveFinding(req.params.id);
    res.json(createSuccessResponse(finding, 'Finding marked resolved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function triggerExport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const format = req.body.format === 'csv' ? 'csv' : 'json';
    const operationId = policyService.triggerExportAsync(format);
    res.status(202).json(createSuccessResponse({ operationId }, 'Compliance findings export initiated'));
  } catch (error) {
    next(error);
  }
}

export async function listSchedules(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = policyService.listSchedules();
    res.json(createSuccessResponse(list, 'Schedules listed successfully'));
  } catch (error) {
    next(error);
  }
}

export async function createSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = policyScheduleSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const schedule = policyService.createSchedule(parseResult.data);
    res.status(201).json(createSuccessResponse(schedule, 'Schedule created successfully'));
  } catch (error) {
    next(error);
  }
}

export async function deleteSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    policyService.deleteSchedule(req.params.id);
    res.json(createSuccessResponse(null, 'Schedule deleted successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getOperationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = policyService.getOperation(req.params.operationId);
    res.json(createSuccessResponse(status, 'Operation status retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getOperationsHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const history = policyService.getOperationsHistory();
    res.json(createSuccessResponse(history, 'Operations history retrieved successfully'));
  } catch (error) {
    next(error);
  }
}
