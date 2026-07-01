import { Router } from 'express';
import dockerRouter from './docker.routes.js';
import workspaceRouter from './workspace.routes.js';
import containerRouter from './container.routes.js';
import imageRouter from './image.routes.js';
import networkRouter from './network.routes.js';
import volumeRouter from './volume.routes.js';
import dockerfileRouter from './dockerfile.routes.js';
import composeRouter from './compose.routes.js';
import monitoringRouter from './monitoring.routes.js';
import registryRouter from '../registry/registry.router.js';

const router = Router();

router.use(dockerRouter);
router.use(workspaceRouter);
router.use(containerRouter);
router.use(imageRouter);
router.use(networkRouter);
router.use(volumeRouter);
router.use(dockerfileRouter);
router.use(composeRouter);
router.use(monitoringRouter);
router.use(registryRouter);

export default router;
