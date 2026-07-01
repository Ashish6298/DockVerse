import { Router } from 'express';
import {
  getProviders,
  login,
  logout,
  getAuthStatus,
  searchRepositories,
  getTags,
  getManifest,
  startPull,
  startPush,
  getOperationProgress,
  getRateLimit,
  getHealth
} from './registry.controller.js';

const router = Router();

router.get('/registry/providers', getProviders);
router.post('/registry/login', login);
router.post('/registry/logout/:providerId', logout);
router.get('/registry/auth/:providerId', getAuthStatus);
router.post('/registry/search', searchRepositories);
router.get('/registry/tags', getTags);
router.get('/registry/manifest', getManifest);
router.post('/registry/pull', startPull);
router.post('/registry/push', startPush);
router.get('/registry/operation/:operationId', getOperationProgress);
router.get('/registry/ratelimit', getRateLimit);
router.get('/registry/health', getHealth);

export default router;
