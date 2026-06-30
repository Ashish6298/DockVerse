import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';
import { ApiErrorResponse } from '@dockverse/types';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const status = 500;
  const message = err.message || 'Internal Server Error';

  logger.error({ err, path: req.path, method: req.method }, 'Request error occurred');

  const errorResponse: ApiErrorResponse = {
    success: false,
    timestamp: new Date().toISOString(),
    message,
    error: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  };

  res.status(status).json(errorResponse);
}

export default errorHandler;
