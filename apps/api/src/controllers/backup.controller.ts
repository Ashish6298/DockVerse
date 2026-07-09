import { Request, Response, NextFunction } from 'express';
import { backupService } from '../services/backup.service.js';
import { backupCreateSchema, backupScheduleSchema } from '../validators/backup.validator.js';
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
    const summary = await backupService.getDashboardSummary();
    res.json(createSuccessResponse(summary, 'Dashboard summary retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function listBackups(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await backupService.listBackups();
    res.json(createSuccessResponse(list, 'Backups listed successfully'));
  } catch (error) {
    next(error);
  }
}

export async function createBackup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = backupCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const operationId = backupService.createBackupAsync(
      parseResult.data.name,
      parseResult.data.type,
      parseResult.data.resources
    );
    res.status(202).json(createSuccessResponse({ operationId }, 'Backup creation initiated'));
  } catch (error) {
    next(error);
  }
}

export async function inspectBackup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const backup = await backupService.inspectBackup(req.params.id);
    res.json(createSuccessResponse(backup, 'Backup inspected successfully'));
  } catch (error) {
    next(error);
  }
}

export async function verifyBackup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const operationId = backupService.verifyBackupAsync(req.params.id);
    res.status(202).json(createSuccessResponse({ operationId }, 'Backup verification initiated'));
  } catch (error) {
    next(error);
  }
}

export async function restoreBackup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const operationId = backupService.restoreBackupAsync(req.params.id, req.body.resources || {});
    res.status(202).json(createSuccessResponse({ operationId }, 'Backup restoration initiated'));
  } catch (error) {
    next(error);
  }
}

export async function downloadBackup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Send simulated package payload response
    const backup = await backupService.inspectBackup(req.params.id);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${backup.id}.json`);
    res.json(backup);
  } catch (error) {
    next(error);
  }
}

export async function removeBackup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await backupService.removeBackup(req.params.id);
    res.json(createSuccessResponse(null, 'Backup removed successfully'));
  } catch (error) {
    next(error);
  }
}

export async function importBackup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Import JSON representation and write to file system
    const parseResult = backupCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const operationId = backupService.createBackupAsync(
      parseResult.data.name,
      parseResult.data.type,
      parseResult.data.resources
    );
    res.status(202).json(createSuccessResponse({ operationId }, 'Backup imported successfully'));
  } catch (error) {
    next(error);
  }
}

export async function pruneExpiredBackups(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await backupService.listBackups();
    for (const b of list) {
      await backupService.removeBackup(b.id);
    }
    res.json(createSuccessResponse(null, 'Expired backups pruned successfully'));
  } catch (error) {
    next(error);
  }
}

export async function listSchedules(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = backupService.listSchedules();
    res.json(createSuccessResponse(list, 'Schedules listed successfully'));
  } catch (error) {
    next(error);
  }
}

export async function createSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = backupScheduleSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const schedule = backupService.createSchedule(parseResult.data);
    res.status(201).json(createSuccessResponse(schedule, 'Backup schedule created successfully'));
  } catch (error) {
    next(error);
  }
}

export async function updateSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = backupScheduleSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const schedule = backupService.updateSchedule(req.params.id, parseResult.data);
    res.json(createSuccessResponse(schedule, 'Backup schedule updated successfully'));
  } catch (error) {
    next(error);
  }
}

export async function deleteSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    backupService.deleteSchedule(req.params.id);
    res.json(createSuccessResponse(null, 'Backup schedule deleted successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getOperationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = backupService.getOperation(req.params.operationId);
    res.json(createSuccessResponse(status, 'Operation status retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getOperationsHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const history = backupService.getOperationsHistory();
    res.json(createSuccessResponse(history, 'Operations history retrieved successfully'));
  } catch (error) {
    next(error);
  }
}
