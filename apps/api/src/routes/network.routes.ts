import { Router } from 'express';
import {
  listNetworks,
  inspectNetwork,
  createNetwork,
  deleteNetwork,
  connectContainer,
  disconnectContainer,
  pruneNetworks
} from '../controllers/network.controller.js';

const router = Router();

router.get('/networks', listNetworks);
router.post('/networks', createNetwork);
router.post('/networks/prune', pruneNetworks);
router.get('/networks/:id', inspectNetwork);
router.delete('/networks/:id', deleteNetwork);
router.post('/networks/:id/connect', connectContainer);
router.post('/networks/:id/disconnect', disconnectContainer);

export default router;
