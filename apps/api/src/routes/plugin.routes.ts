import { Router } from 'express';
import {
  listPlugins,
  inspectPlugin,
  getPluginPrivileges,
  installPlugin,
  enablePlugin,
  disablePlugin,
  upgradePlugin,
  configurePlugin,
  removePlugin,
  getOperationStatus
} from '../controllers/plugin.controller.js';

const router = Router();

router.get('/plugins', listPlugins);
router.get('/plugins/privileges', getPluginPrivileges);
router.post('/plugins', installPlugin);
router.get('/plugins/operations/:operationId', getOperationStatus);

router.get('/plugins/:id', inspectPlugin);
router.delete('/plugins/:id', removePlugin);
router.post('/plugins/:id/enable', enablePlugin);
router.post('/plugins/:id/disable', disablePlugin);
router.post('/plugins/:id/upgrade', upgradePlugin);
router.post('/plugins/:id/configure', configurePlugin);

export default router;
