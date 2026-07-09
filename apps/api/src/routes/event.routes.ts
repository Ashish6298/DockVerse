import { Router } from 'express';
import {
  getDashboardSummary,
  listEvents,
  triggerExport,
  triggerMaintenance,
  listSchedules,
  createSchedule,
  deleteSchedule,
  getOperationStatus,
  getOperationsHistory
} from '../controllers/event.controller.js';

const router = Router();

router.get('/events/dashboard', getDashboardSummary);
router.get('/events/logs', listEvents);
router.post('/events/export', triggerExport);
router.post('/events/maintenance', triggerMaintenance);

router.get('/events/schedules', listSchedules);
router.post('/events/schedules', createSchedule);
router.delete('/events/schedules/:id', deleteSchedule);

router.get('/events/operations', getOperationsHistory);
router.get('/events/operations/:operationId', getOperationStatus);

export default router;
