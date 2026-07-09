import { Request, Response, NextFunction } from 'express';
import { hostService } from '../services/host.service.js';
import { hostCreateSchema } from '../validators/host.validator.js';
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
    const summary = await hostService.getDashboardSummary();
    res.json(createSuccessResponse(summary, 'Dashboard summary retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function listHosts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = hostService.listHosts();
    res.json(createSuccessResponse(list, 'Hosts listed successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getHost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const host = hostService.getHost(req.params.id);
    res.json(createSuccessResponse(host, 'Host retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function createHost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = hostCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const host = hostService.createHost(parseResult.data);
    res.status(201).json(createSuccessResponse(host, 'Host created successfully'));
  } catch (error) {
    next(error);
  }
}

export async function updateHost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const host = hostService.updateHost(req.params.id, req.body);
    res.json(createSuccessResponse(host, 'Host updated successfully'));
  } catch (error) {
    next(error);
  }
}

export async function deleteHost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    hostService.deleteHost(req.params.id);
    res.json(createSuccessResponse(null, 'Host deleted successfully'));
  } catch (error) {
    next(error);
  }
}

export async function testConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const operationId = hostService.testConnectionAsync(req.params.id);
    res.status(202).json(createSuccessResponse({ operationId }, 'Connection test initiated'));
  } catch (error) {
    next(error);
  }
}

export async function connectHost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const operationId = hostService.connectHostAsync(req.params.id);
    res.status(202).json(createSuccessResponse({ operationId }, 'Connection handshake initiated'));
  } catch (error) {
    next(error);
  }
}

export async function disconnectHost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const operationId = hostService.disconnectHostAsync(req.params.id);
    res.status(202).json(createSuccessResponse({ operationId }, 'Disconnection initiated'));
  } catch (error) {
    next(error);
  }
}

export async function reconnectHost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const operationId = hostService.connectHostAsync(req.params.id);
    res.status(202).json(createSuccessResponse({ operationId }, 'Reconnection initiated'));
  } catch (error) {
    next(error);
  }
}

export async function syncMetadata(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const operationId = hostService.syncMetadataAsync(req.params.id);
    res.status(202).json(createSuccessResponse({ operationId }, 'Metadata synchronization initiated'));
  } catch (error) {
    next(error);
  }
}

export async function triggerExport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const format = req.body.format === 'csv' ? 'csv' : 'json';
    const operationId = hostService.triggerExportAsync(format);
    res.status(202).json(createSuccessResponse({ operationId }, 'Fleet inventory export initiated'));
  } catch (error) {
    next(error);
  }
}

export async function importInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Return mock accepted
    res.status(202).json(createSuccessResponse({ operationId: `import_${Date.now()}` }, 'Fleet inventory import initiated'));
  } catch (error) {
    next(error);
  }
}

export async function getOperationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = hostService.getOperation(req.params.operationId);
    res.json(createSuccessResponse(status, 'Operation status retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getOperationsHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const history = hostService.getOperationsHistory();
    res.json(createSuccessResponse(history, 'Operations history retrieved successfully'));
  } catch (error) {
    next(error);
  }
}
