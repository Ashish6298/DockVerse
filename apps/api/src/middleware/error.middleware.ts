import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';
import { ApiErrorResponse } from '@dockverse/types';
import { AppError } from '../utils/errors.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  let status = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'Internal Server Error';

  if (err instanceof AppError) {
    status = err.status;
    code = err.code;
  } else if (message.includes('Docker daemon') || message.includes('unreachable')) {
    status = 503;
    code = 'DOCKER_CONNECTION_ERROR';
  }

  logger.error({ err, path: req.path, method: req.method }, 'Request error occurred');

  const errorResponse: ApiErrorResponse = {
    success: false,
    timestamp: new Date().toISOString(),
    message,
    code,
    error: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  };

  res.status(status).json(errorResponse);
}

export default errorHandler;
