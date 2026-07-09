import { Router } from 'express';
import {
  getSwarmStatus,
  inspectSwarm,
  initSwarm,
  joinSwarm,
  leaveSwarm,
  getSwarmTokens,
  rotateSwarmTokens,
  getSwarmUnlockKey,
  updateSwarmSpec,
  listNodes,
  inspectNode,
  promoteNode,
  demoteNode,
  drainNode,
  activateNode,
  pauseNode,
  removeNode,
  listServices,
  inspectService,
  listTasks,
  inspectTask,
  getClusterHealth,
  getOperationsHistory,
  getOperationStatus
} from '../controllers/swarm.controller.js';

const router = Router();

router.get('/swarm', getSwarmStatus);
router.get('/swarm/inspect', inspectSwarm);
router.post('/swarm/init', initSwarm);
router.post('/swarm/join', joinSwarm);
router.post('/swarm/leave', leaveSwarm);
router.get('/swarm/tokens', getSwarmTokens);
router.post('/swarm/tokens/rotate', rotateSwarmTokens);
router.get('/swarm/unlockkey', getSwarmUnlockKey);
router.post('/swarm/update', updateSwarmSpec);

router.get('/swarm/nodes', listNodes);
router.get('/swarm/nodes/:id', inspectNode);
router.post('/swarm/nodes/:id/promote', promoteNode);
router.post('/swarm/nodes/:id/demote', demoteNode);
router.post('/swarm/nodes/:id/drain', drainNode);
router.post('/swarm/nodes/:id/activate', activateNode);
router.post('/swarm/nodes/:id/pause', pauseNode);
router.delete('/swarm/nodes/:id', removeNode);

router.get('/swarm/services', listServices);
router.get('/swarm/services/:id', inspectService);

router.get('/swarm/tasks', listTasks);
router.get('/swarm/tasks/:id', inspectTask);

router.get('/swarm/health', getClusterHealth);
router.get('/swarm/operations', getOperationsHistory);
router.get('/swarm/operations/:operationId', getOperationStatus);

export default router;
