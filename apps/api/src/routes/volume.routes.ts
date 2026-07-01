import { Router } from 'express';
import {
  listVolumes,
  inspectVolume,
  createVolume,
  deleteVolume,
  pruneVolumes
} from '../controllers/volume.controller.js';

const router = Router();

router.get('/volumes', listVolumes);
router.post('/volumes', createVolume);
router.post('/volumes/prune', pruneVolumes);
router.get('/volumes/:name', inspectVolume);
router.delete('/volumes/:name', deleteVolume);

export default router;
