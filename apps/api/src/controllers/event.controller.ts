import { Request, Response, NextFunction } from 'express';
import { eventService } from '../services/event.service.js';
import { eventFilterSchema, eventScheduleSchema } from '../validators/event.validator.js';
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
    const summary = await eventService.getDashboardSummary();
    res.json(createSuccessResponse(summary, 'Dashboard summary retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function listEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = eventFilterSchema.safeParse(req.query);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const list = eventService.listEvents(parseResult.data);
    res.json(createSuccessResponse(list, 'Events listed successfully'));
  } catch (error) {
    next(error);
  }
}

export async function triggerExport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const format = req.body.format === 'csv' ? 'csv' : 'json';
    const operationId = eventService.triggerExportAsync(format);
    res.status(202).json(createSuccessResponse({ operationId }, 'Audit export initiated'));
  } catch (error) {
    next(error);
  }
}

export async function triggerMaintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const operationId = eventService.triggerMaintenanceAsync();
    res.status(202).json(createSuccessResponse({ operationId }, 'Logs pruning maintenance initiated'));
  } catch (error) {
    next(error);
  }
}

export async function listSchedules(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = eventService.listSchedules();
    res.json(createSuccessResponse(list, 'Schedules listed successfully'));
  } catch (error) {
    next(error);
  }
}

export async function createSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = eventScheduleSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const schedule = eventService.createSchedule(parseResult.data);
    res.status(201).json(createSuccessResponse(schedule, 'Schedule created successfully'));
  } catch (error) {
    next(error);
  }
}

export async function deleteSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    eventService.deleteSchedule(req.params.id);
    res.json(createSuccessResponse(null, 'Schedule deleted successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getOperationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = eventService.getOperation(req.params.operationId);
    res.json(createSuccessResponse(status, 'Operation status retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getOperationsHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const history = eventService.getOperationsHistory();
    res.json(createSuccessResponse(history, 'Operations history retrieved successfully'));
  } catch (error) {
    next(error);
  }
}
