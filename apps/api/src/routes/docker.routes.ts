import { Router } from 'express';
import {
  getHealth,
  getDockerInfo,
  getDashboardData,
  getDockerVersion,
  getDockerStatus
} from '../controllers/docker.controller.js';

const router = Router();

router.get('/health', getHealth);
router.get('/docker/info', getDockerInfo);
router.get('/docker/dashboard', getDashboardData);
router.get('/docker/version', getDockerVersion);
router.get('/docker/status', getDockerStatus);

export default router;
