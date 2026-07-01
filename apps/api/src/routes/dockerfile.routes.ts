import { Router } from 'express';
import {
  getTemplates,
  validateDockerfile,
  analyzeDockerfile,
  startBuild,
  getBuildProgress,
  getBuildHistory
} from '../controllers/dockerfile.controller.js';

const router = Router();

router.get('/dockerfiles/templates', getTemplates);
router.post('/dockerfiles/validate', validateDockerfile);
router.post('/dockerfiles/analyze', analyzeDockerfile);
router.post('/dockerfiles/build', startBuild);
router.get('/dockerfiles/build/:buildId', getBuildProgress);
router.get('/dockerfiles/history', getBuildHistory);

export default router;
