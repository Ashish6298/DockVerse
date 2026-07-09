import { Request, Response, NextFunction } from 'express';
import { swarmService } from '../services/swarm.service.js';
import {
  swarmInitSchema,
  swarmJoinSchema,
  swarmLeaveSchema,
  swarmUpdateSchema
} from '../validators/swarm.validator.js';
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

export async function getSwarmStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = await swarmService.getSwarmStatus();
    res.json(createSuccessResponse(status, 'Swarm status retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function inspectSwarm(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const details = await swarmService.inspectSwarm();
    res.json(createSuccessResponse(details, 'Swarm cluster details retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function initSwarm(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = swarmInitSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const operationId = swarmService.initSwarmAsync(parseResult.data);
    res.status(202).json(createSuccessResponse({ operationId }, 'Swarm initialization initiated'));
  } catch (error) {
    next(error);
  }
}

export async function joinSwarm(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = swarmJoinSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const operationId = swarmService.joinSwarmAsync(parseResult.data);
    res.status(202).json(createSuccessResponse({ operationId }, 'Swarm join initiated'));
  } catch (error) {
    next(error);
  }
}

export async function leaveSwarm(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = swarmLeaveSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const operationId = swarmService.leaveSwarmAsync(parseResult.data);
    res.status(202).json(createSuccessResponse({ operationId }, 'Swarm leave initiated'));
  } catch (error) {
    next(error);
  }
}

export async function getSwarmTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tokens = await swarmService.getSwarmTokens();
    res.json(createSuccessResponse(tokens, 'Swarm join tokens retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function rotateSwarmTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role } = req.body;
    if (role !== 'manager' && role !== 'worker') {
      throw new ValidationError('Role must be either manager or worker');
    }
    const operationId = swarmService.rotateSwarmTokensAsync(role);
    res.status(202).json(createSuccessResponse({ operationId }, 'Swarm token rotation initiated'));
  } catch (error) {
    next(error);
  }
}

export async function getSwarmUnlockKey(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const key = await swarmService.getSwarmUnlockKey();
    res.json(createSuccessResponse(key, 'Swarm unlock key retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function updateSwarmSpec(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parseResult = swarmUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const operationId = swarmService.updateSwarmSpecAsync(parseResult.data);
    res.status(202).json(createSuccessResponse({ operationId }, 'Swarm specification update initiated'));
  } catch (error) {
    next(error);
  }
}

export async function listNodes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await swarmService.listNodes();
    res.json(createSuccessResponse(list, 'Swarm nodes listed successfully'));
  } catch (error) {
    next(error);
  }
}

export async function inspectNode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const details = await swarmService.inspectNode(req.params.id);
    res.json(createSuccessResponse(details, 'Node details retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function promoteNode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const operationId = swarmService.mutateNodeAsync(req.params.id, 'promote');
    res.status(202).json(createSuccessResponse({ operationId }, 'Node promotion initiated'));
  } catch (error) {
    next(error);
  }
}

export async function demoteNode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const operationId = swarmService.mutateNodeAsync(req.params.id, 'demote');
    res.status(202).json(createSuccessResponse({ operationId }, 'Node demotion initiated'));
  } catch (error) {
    next(error);
  }
}

export async function drainNode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const operationId = swarmService.mutateNodeAsync(req.params.id, 'drain');
    res.status(202).json(createSuccessResponse({ operationId }, 'Node draining initiated'));
  } catch (error) {
    next(error);
  }
}

export async function activateNode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const operationId = swarmService.mutateNodeAsync(req.params.id, 'activate');
    res.status(202).json(createSuccessResponse({ operationId }, 'Node activation initiated'));
  } catch (error) {
    next(error);
  }
}

export async function pauseNode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const operationId = swarmService.mutateNodeAsync(req.params.id, 'pause');
    res.status(202).json(createSuccessResponse({ operationId }, 'Node scheduling pausing initiated'));
  } catch (error) {
    next(error);
  }
}

export async function removeNode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const force = req.query.force === 'true';
    const operationId = swarmService.removeNodeAsync(req.params.id, force);
    res.status(202).json(createSuccessResponse({ operationId }, 'Node removal initiated'));
  } catch (error) {
    next(error);
  }
}

export async function listServices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await swarmService.listServices();
    res.json(createSuccessResponse(list, 'Swarm services listed successfully'));
  } catch (error) {
    next(error);
  }
}

export async function inspectService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const details = await swarmService.inspectService(req.params.id);
    res.json(createSuccessResponse(details, 'Service details retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function listTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const serviceId = req.query.serviceId as string | undefined;
    const list = await swarmService.listTasks(serviceId);
    res.json(createSuccessResponse(list, 'Swarm tasks listed successfully'));
  } catch (error) {
    next(error);
  }
}

export async function inspectTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const details = await swarmService.inspectTask(req.params.id);
    res.json(createSuccessResponse(details, 'Task details retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getClusterHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const health = await swarmService.getClusterHealth();
    res.json(createSuccessResponse(health, 'Cluster health metrics retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getOperationsHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const history = swarmService.getOperationsHistory();
    res.json(createSuccessResponse(history, 'Swarm operations history retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getOperationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = swarmService.getOperation(req.params.operationId);
    res.json(createSuccessResponse(status, 'Operation status retrieved successfully'));
  } catch (error) {
    next(error);
  }
}
