import { Router } from 'express';
import {
  listContainers,
  inspectContainer,
  createContainer,
  startContainer,
  stopContainer,
  restartContainer,
  pauseContainer,
  unpauseContainer,
  killContainer,
  removeContainer,
  renameContainer,
  getContainerLogs
} from '../controllers/container.controller.js';

const router = Router();

router.get('/containers', listContainers);
router.post('/containers', createContainer);
router.get('/containers/:id', inspectContainer);
router.post('/containers/:id/start', startContainer);
router.post('/containers/:id/stop', stopContainer);
router.post('/containers/:id/restart', restartContainer);
router.post('/containers/:id/pause', pauseContainer);
router.post('/containers/:id/unpause', unpauseContainer);
router.post('/containers/:id/kill', killContainer);
router.delete('/containers/:id', removeContainer);
router.post('/containers/:id/rename', renameContainer);
router.get('/containers/:id/logs', getContainerLogs);

export default router;
