import { Router } from 'express';
import {
  getDashboardSummary,
  listHosts,
  createHost,
  getHost,
  updateHost,
  deleteHost,
  testConnection,
  connectHost,
  disconnectHost,
  reconnectHost,
  syncMetadata,
  triggerExport,
  importInventory,
  getOperationStatus,
  getOperationsHistory
} from '../controllers/host.controller.js';

const router = Router();

router.get('/hosts/dashboard', getDashboardSummary);
router.get('/hosts', listHosts);
router.post('/hosts', createHost);
router.get('/hosts/:id', getHost);
router.put('/hosts/:id', updateHost);
router.delete('/hosts/:id', deleteHost);

router.post('/hosts/:id/test', testConnection);
router.post('/hosts/:id/connect', connectHost);
router.post('/hosts/:id/disconnect', disconnectHost);
router.post('/hosts/:id/reconnect', reconnectHost);
router.post('/hosts/:id/sync', syncMetadata);

router.post('/hosts/export', triggerExport);
router.post('/hosts/import', importInventory);

router.get('/hosts/operations', getOperationsHistory);
router.get('/hosts/operations/:operationId', getOperationStatus);

export default router;
