import { Request, Response, NextFunction } from 'express';
import { networkService } from '../services/network.service.js';
import { createNetworkSchema, connectContainerSchema, disconnectContainerSchema } from '../validators/network.validator.js';
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

export async function listNetworks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await networkService.listNetworks();
    res.json(createSuccessResponse(list, 'Networks listed successfully'));
  } catch (error) {
    next(error);
  }
}

export async function inspectNetwork(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const details = await networkService.inspectNetwork(req.params.id);
    res.json(createSuccessResponse(details, 'Network details retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function createNetwork(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = createNetworkSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const created = await networkService.createNetwork(parseResult.data);
    res.status(201).json(createSuccessResponse(created, 'Network created successfully'));
  } catch (error) {
    next(error);
  }
}

export async function deleteNetwork(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await networkService.deleteNetwork(req.params.id);
    res.json(createSuccessResponse(null, 'Network deleted successfully'));
  } catch (error) {
    next(error);
  }
}

export async function connectContainer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = connectContainerSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    await networkService.connectContainer(req.params.id, parseResult.data.container);
    res.json(createSuccessResponse(null, 'Container connected to network successfully'));
  } catch (error) {
    next(error);
  }
}

export async function disconnectContainer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = disconnectContainerSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const { container, force } = parseResult.data;
    await networkService.disconnectContainer(req.params.id, container, force);
    res.json(createSuccessResponse(null, 'Container disconnected from network successfully'));
  } catch (error) {
    next(error);
  }
}

export async function pruneNetworks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await networkService.pruneNetworks();
    res.json(createSuccessResponse(result, 'Unused networks pruned successfully'));
  } catch (error) {
    next(error);
  }
}
