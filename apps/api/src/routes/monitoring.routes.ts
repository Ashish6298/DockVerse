import { Router } from 'express';
import { getContainerStats, getSummary } from '../controllers/monitoring.controller.js';

const router = Router();

router.get('/monitoring/summary', getSummary);
router.get('/monitoring/containers/:id/stats', getContainerStats);

export default router;
