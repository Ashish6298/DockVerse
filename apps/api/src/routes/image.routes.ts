import { Router } from 'express';
import {
  listImages,
  inspectImage,
  pullImage,
  deleteImage,
  tagImage,
  getImageHistory,
  pruneImages
} from '../controllers/image.controller.js';

const router = Router();

router.get('/images', listImages);
router.post('/images/pull', pullImage);
router.post('/images/prune', pruneImages);
router.get('/images/:id', inspectImage);
router.delete('/images/:id', deleteImage);
router.post('/images/:id/tag', tagImage);
router.get('/images/:id/history', getImageHistory);

export default router;
