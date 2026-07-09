import { Router } from 'express';
import {
  getDashboardSummary,
  listPolicies,
  createPolicy,
  getPolicy,
  updatePolicy,
  deletePolicy,
  triggerScan,
  listFindings,
  getFinding,
  acknowledgeFinding,
  ignoreFinding,
  resolveFinding,
  triggerExport,
  listSchedules,
  createSchedule,
  deleteSchedule,
  getOperationStatus,
  getOperationsHistory
} from '../controllers/policy.controller.js';

const router = Router();

router.get('/policies/dashboard', getDashboardSummary);
router.get('/policies', listPolicies);
router.post('/policies', createPolicy);
router.get('/policies/:id', getPolicy);
router.put('/policies/:id', updatePolicy);
router.delete('/policies/:id', deletePolicy);

router.post('/policies/scan', triggerScan);
router.get('/policies/findings', listFindings);
router.get('/policies/findings/:id', getFinding);
router.patch('/policies/findings/:id/acknowledge', acknowledgeFinding);
router.patch('/policies/findings/:id/ignore', ignoreFinding);
router.patch('/policies/findings/:id/resolve', resolveFinding);

router.post('/policies/export', triggerExport);

router.get('/policies/schedules', listSchedules);
router.post('/policies/schedules', createSchedule);
router.delete('/policies/schedules/:id', deleteSchedule);

router.get('/policies/operations', getOperationsHistory);
router.get('/policies/operations/:operationId', getOperationStatus);

export default router;
