import { Router } from 'express';
import {
  getDashboardSummary,
  listBackups,
  createBackup,
  inspectBackup,
  verifyBackup,
  restoreBackup,
  downloadBackup,
  removeBackup,
  importBackup,
  pruneExpiredBackups,
  listSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getOperationStatus,
  getOperationsHistory
} from '../controllers/backup.controller.js';

const router = Router();

router.get('/backups/dashboard', getDashboardSummary);
router.get('/backups/operations', getOperationsHistory);
router.get('/backups/operations/:operationId', getOperationStatus);

router.get('/backups', listBackups);
router.post('/backups', createBackup);
router.get('/backups/:id', inspectBackup);
router.post('/backups/:id/verify', verifyBackup);
router.post('/backups/:id/restore', restoreBackup);
router.post('/backups/:id/download', downloadBackup);
router.delete('/backups/:id', removeBackup);

router.post('/backups/import', importBackup);
router.post('/backups/prune', pruneExpiredBackups);

router.get('/backups/schedules', listSchedules);
router.post('/backups/schedules', createSchedule);
router.put('/backups/schedules/:id', updateSchedule);
router.delete('/backups/schedules/:id', deleteSchedule);

export default router;
