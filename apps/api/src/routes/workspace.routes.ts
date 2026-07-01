import { Router } from 'express';
import {
  listWorkspaces,
  getWorkspace,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace
} from '../controllers/workspace.controller.js';

const router = Router();

router.get('/workspaces', listWorkspaces);
router.get('/workspaces/:id', getWorkspace);
router.post('/workspaces', createWorkspace);
router.put('/workspaces/:id', updateWorkspace);
router.delete('/workspaces/:id', deleteWorkspace);

export default router;
