import { Request, Response, NextFunction } from 'express';
import { volumeService } from '../services/volume.service.js';
import { createVolumeSchema } from '../validators/volume.validator.js';
import { ApiResponse } from '@dockverse/types';
import { ValidationError } from '../utils/errors.js';

function createSuccessResponse<T>(data: T, message: string): ApiResponse<T> {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    message,
    data,
  };
}

export async function listVolumes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await volumeService.listVolumes();
    res.json(createSuccessResponse(list, 'Volumes listed successfully'));
  } catch (error) {
    next(error);
  }
}

export async function inspectVolume(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const details = await volumeService.inspectVolume(req.params.name);
    res.json(createSuccessResponse(details, 'Volume details retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function createVolume(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = createVolumeSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const created = await volumeService.createVolume(parseResult.data);
    res.status(201).json(createSuccessResponse(created, 'Volume created successfully'));
  } catch (error) {
    next(error);
  }
}

export async function deleteVolume(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await volumeService.deleteVolume(req.params.name);
    res.json(createSuccessResponse(null, 'Volume deleted successfully'));
  } catch (error) {
    next(error);
  }
}

export async function pruneVolumes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await volumeService.pruneVolumes();
    res.json(createSuccessResponse(result, 'Unused volumes pruned successfully'));
  } catch (error) {
    next(error);
  }
}
