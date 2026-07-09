import { Router } from 'express';
import {
  listSecrets,
  inspectSecret,
  checkSecretUsage,
  createSecret,
  removeSecret,
  listConfigs,
  inspectConfig,
  checkConfigUsage,
  createConfig,
  removeConfig,
  getDashboardSummary,
  getOperationStatus,
  getOperationsHistory
} from '../controllers/resource.controller.js';

const router = Router();

router.get('/resources/dashboard', getDashboardSummary);
router.get('/resources/operations', getOperationsHistory);
router.get('/resources/operations/:operationId', getOperationStatus);

router.get('/resources/secrets', listSecrets);
router.post('/resources/secrets', createSecret);
router.get('/resources/secrets/:id', inspectSecret);
router.get('/resources/secrets/:id/usage', checkSecretUsage);
router.delete('/resources/secrets/:id', removeSecret);

router.get('/resources/configs', listConfigs);
router.post('/resources/configs', createConfig);
router.get('/resources/configs/:id', inspectConfig);
router.get('/resources/configs/:id/usage', checkConfigUsage);
router.delete('/resources/configs/:id', removeConfig);

export default router;
