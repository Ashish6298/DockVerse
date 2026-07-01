import { Request, Response, NextFunction } from 'express';
import { imageService } from '../services/image.service.js';
import { pullImageSchema, tagImageSchema } from '../validators/image.validator.js';
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

export async function listImages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await imageService.listImages();
    res.json(createSuccessResponse(list, 'Images listed successfully'));
  } catch (error) {
    next(error);
  }
}

export async function inspectImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const details = await imageService.inspectImage(req.params.id);
    res.json(createSuccessResponse(details, 'Image details retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function pullImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = pullImageSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const { fromImage, tag } = parseResult.data;
    await imageService.pullImage(fromImage, tag);
    res.status(201).json(createSuccessResponse(null, 'Image pulled successfully'));
  } catch (error) {
    next(error);
  }
}

export async function deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const force = req.query.force === 'true';
    await imageService.deleteImage(req.params.id, force);
    res.json(createSuccessResponse(null, 'Image deleted successfully'));
  } catch (error) {
    next(error);
  }
}

export async function tagImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = tagImageSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const { repo, tag } = parseResult.data;
    await imageService.tagImage(req.params.id, repo, tag);
    res.json(createSuccessResponse(null, 'Image tagged successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getImageHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const history = await imageService.getImageHistory(req.params.id);
    res.json(createSuccessResponse(history, 'Image build layers history retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function pruneImages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await imageService.pruneImages();
    res.json(createSuccessResponse(result, 'Unused images pruned successfully'));
  } catch (error) {
    next(error);
  }
}
