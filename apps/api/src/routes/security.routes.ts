import { Router } from 'express';
import {
  getDashboardSummary,
  listFindings,
  ignoreFinding,
  triggerScan,
  listSchedules,
  createSchedule,
  deleteSchedule,
  getOperationStatus,
  getOperationsHistory
} from '../controllers/security.controller.js';

const router = Router();

router.get('/security/dashboard', getDashboardSummary);
router.get('/security/findings', listFindings);
router.delete('/security/findings/:id', ignoreFinding);
router.post('/security/scan', triggerScan);

router.get('/security/schedules', listSchedules);
router.post('/security/schedules', createSchedule);
router.delete('/security/schedules/:id', deleteSchedule);

router.get('/security/operations', getOperationsHistory);
router.get('/security/operations/:operationId', getOperationStatus);

export default router;
