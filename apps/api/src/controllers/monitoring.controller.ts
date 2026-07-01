import { Request, Response, NextFunction } from 'express';
import { monitoringService } from '../services/monitoring.service.js';
import { ApiResponse } from '@dockverse/types';

function createSuccessResponse<T>(data: T, message: string): ApiResponse<T> {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    message,
    data,
  };
}

export function getContainerStats(req: Request, res: Response, next: NextFunction): void {
  try {
    const history = monitoringService.getContainerStats(req.params.id);
    res.json(createSuccessResponse(history, 'Container metrics retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export function getSummary(req: Request, res: Response, next: NextFunction): void {
  try {
    const summary = monitoringService.getSummary();
    res.json(createSuccessResponse(summary, 'Telemetry metrics summary retrieved successfully'));
  } catch (error) {
    next(error);
  }
}
