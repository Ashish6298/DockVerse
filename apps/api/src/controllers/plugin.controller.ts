import { Request, Response, NextFunction } from 'express';
import { pluginService } from '../services/plugin.service.js';
import { installPluginSchema, configurePluginSchema, upgradePluginSchema } from '../validators/plugin.validator.js';
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

export async function listPlugins(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await pluginService.listPlugins();
    res.json(createSuccessResponse(list, 'Plugins listed successfully'));
  } catch (error) {
    next(error);
  }
}

export async function inspectPlugin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const details = await pluginService.inspectPlugin(req.params.id);
    res.json(createSuccessResponse(details, 'Plugin details retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getPluginPrivileges(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const remoteName = req.query.remoteName as string;
    if (!remoteName) {
      throw new ValidationError('remoteName query parameter is required');
    }
    const privileges = await pluginService.getPluginPrivileges(remoteName);
    res.json(createSuccessResponse(privileges, 'Plugin privileges retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function installPlugin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = installPluginSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const operationId = pluginService.installPlugin(parseResult.data);
    res.status(202).json(createSuccessResponse({ operationId }, 'Plugin installation initiated'));
  } catch (error) {
    next(error);
  }
}

export async function enablePlugin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await pluginService.enablePlugin(req.params.id);
    res.json(createSuccessResponse(null, 'Plugin enabled successfully'));
  } catch (error) {
    next(error);
  }
}

export async function disablePlugin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const force = req.query.force === 'true';
    await pluginService.disablePlugin(req.params.id, force);
    res.json(createSuccessResponse(null, 'Plugin disabled successfully'));
  } catch (error) {
    next(error);
  }
}

export async function configurePlugin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = configurePluginSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    await pluginService.configurePlugin(req.params.id, parseResult.data);
    res.json(createSuccessResponse(null, 'Plugin configured successfully'));
  } catch (error) {
    next(error);
  }
}

export async function upgradePlugin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = upgradePluginSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const operationId = pluginService.upgradePlugin(req.params.id, parseResult.data);
    res.status(202).json(createSuccessResponse({ operationId }, 'Plugin upgrade initiated'));
  } catch (error) {
    next(error);
  }
}

export async function removePlugin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const force = req.query.force === 'true';
    await pluginService.removePlugin(req.params.id, force);
    res.json(createSuccessResponse(null, 'Plugin uninstalled successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getOperationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = pluginService.getOperation(req.params.operationId);
    res.json(createSuccessResponse(status, 'Plugin operation status retrieved'));
  } catch (error) {
    next(error);
  }
}
