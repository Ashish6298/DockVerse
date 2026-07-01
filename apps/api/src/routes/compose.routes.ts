import { Router } from 'express';
import {
  getTemplates,
  validateCompose,
  analyzeCompose,
  runCommand,
  getOperationProgress,
  getOperationHistory
} from '../controllers/compose.controller.js';

const router = Router();

router.get('/compose/templates', getTemplates);
router.post('/compose/validate', validateCompose);
router.post('/compose/analyze', analyzeCompose);
router.post('/compose/run', runCommand);
router.get('/compose/operation/:operationId', getOperationProgress);
router.get('/compose/history', getOperationHistory);

export default router;
