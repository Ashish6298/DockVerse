import { Request, Response, NextFunction } from 'express';
import { containerService } from '../services/container.service.js';
import { createContainerSchema, renameContainerSchema, containerLogsSchema } from '../validators/container.validator.js';
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

export async function listContainers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await containerService.listContainers();
    res.json(createSuccessResponse(list, 'Containers listed successfully'));
  } catch (error) {
    next(error);
  }
}

export async function inspectContainer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const details = await containerService.inspectContainer(req.params.id);
    res.json(createSuccessResponse(details, 'Container details retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function createContainer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = createContainerSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const created = await containerService.createContainer(parseResult.data);
    res.status(201).json(createSuccessResponse(created, 'Container created successfully'));
  } catch (error) {
    next(error);
  }
}

export async function startContainer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await containerService.startContainer(req.params.id);
    res.json(createSuccessResponse(null, 'Container started successfully'));
  } catch (error) {
    next(error);
  }
}

export async function stopContainer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await containerService.stopContainer(req.params.id);
    res.json(createSuccessResponse(null, 'Container stopped successfully'));
  } catch (error) {
    next(error);
  }
}

export async function restartContainer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await containerService.restartContainer(req.params.id);
    res.json(createSuccessResponse(null, 'Container restarted successfully'));
  } catch (error) {
    next(error);
  }
}

export async function pauseContainer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await containerService.pauseContainer(req.params.id);
    res.json(createSuccessResponse(null, 'Container paused successfully'));
  } catch (error) {
    next(error);
  }
}

export async function unpauseContainer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await containerService.unpauseContainer(req.params.id);
    res.json(createSuccessResponse(null, 'Container unpaused successfully'));
  } catch (error) {
    next(error);
  }
}

export async function killContainer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await containerService.killContainer(req.params.id);
    res.json(createSuccessResponse(null, 'Container killed successfully'));
  } catch (error) {
    next(error);
  }
}

export async function removeContainer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const force = req.query.force === 'true';
    await containerService.removeContainer(req.params.id, force);
    res.json(createSuccessResponse(null, 'Container removed successfully'));
  } catch (error) {
    next(error);
  }
}

export async function renameContainer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = renameContainerSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    await containerService.renameContainer(req.params.id, parseResult.data.name);
    res.json(createSuccessResponse(null, 'Container renamed successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getContainerLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = containerLogsSchema.safeParse(req.query);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const { tail, timestamps } = parseResult.data;
    const logs = await containerService.getContainerLogs(req.params.id, tail, timestamps);
    res.json(createSuccessResponse(logs, 'Container logs retrieved successfully'));
  } catch (error) {
    next(error);
  }
}
