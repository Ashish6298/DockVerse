import { Request, Response, NextFunction } from 'express';
import { dockerService } from '../docker/docker.service.js';
import { ApiResponse } from '@dockverse/types';

function createSuccessResponse<T>(data: T, message: string): ApiResponse<T> {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    message,
    data,
  };
}

export async function getHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = await dockerService.checkConnection();
    res.json(createSuccessResponse({ dockerStatus: status }, 'API is healthy'));
  } catch (error) {
    next(error);
  }
}

export async function getDockerInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const info = await dockerService.getDockerInfo();
    res.json(createSuccessResponse(info, 'Docker info retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getDashboardData(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dashboard = await dockerService.getDashboardData();
    res.json(createSuccessResponse(dashboard, 'Dashboard summary retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getDockerVersion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const info = await dockerService.getDockerInfo();
    res.json(createSuccessResponse({
      version: info.system.version,
      apiVersion: info.system.apiVersion,
    }, 'Docker version retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getDockerStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = await dockerService.checkConnection();
    res.json(createSuccessResponse({ status }, 'Docker connection status checked'));
  } catch (error) {
    next(error);
  }
}
