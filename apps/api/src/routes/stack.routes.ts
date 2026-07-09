import { Router } from 'express';
import {
  listStacks,
  inspectStack,
  deployStack,
  scaleStackService,
  removeStack,
  getDashboardSummary,
  getOperationStatus,
  getOperationsHistory
} from '../controllers/stack.controller.js';

const router = Router();

router.get('/stacks/dashboard', getDashboardSummary);
router.get('/stacks/operations', getOperationsHistory);
router.get('/stacks/operations/:operationId', getOperationStatus);

router.get('/stacks', listStacks);
router.post('/stacks', deployStack);
router.get('/stacks/:name', inspectStack);
router.post('/stacks/scale', scaleStackService);
router.delete('/stacks/:name', removeStack);

export default router;
