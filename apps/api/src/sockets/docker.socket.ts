import { Server, Socket } from 'socket.io';
import { dockerService } from '../docker/docker.service.js';
import logger from '../utils/logger.js';
import { SOCKET_EVENTS } from '@dockverse/types';

export function setupDockerSocket(io: Server) {
  const nsp = io.of('/docker');

  nsp.on('connection', (socket: Socket) => {
    logger.info({ socketId: socket.id }, 'Websocket client connected to /docker namespace');

    // Emit initial status
    dockerService.getDashboardData()
      .then((data) => {
        socket.emit(SOCKET_EVENTS.DOCKER_STATUS, data);
      })
      .catch((err) => {
        logger.error({ err }, 'Error sending initial docker status');
      });

    // Handle manual refresh request
    socket.on(SOCKET_EVENTS.DOCKER_REFRESH, async () => {
      logger.info({ socketId: socket.id }, 'Received manual docker refresh request via socket');
      try {
        const data = await dockerService.getDashboardData();
        nsp.emit(SOCKET_EVENTS.DOCKER_STATUS, data);
      } catch (err) {
        logger.error({ err }, 'Error during socket manual refresh');
      }
    });

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Websocket client disconnected from /docker namespace');
    });
  });

  // Background status check to broadcast state changes
  let lastStatus = dockerService.getStatus();
  setInterval(async () => {
    try {
      const currentStatus = await dockerService.checkConnection();
      if (currentStatus !== lastStatus) {
        logger.info({ lastStatus, currentStatus }, 'Docker connection state changed. Broadcasting update...');
        lastStatus = currentStatus;
        const data = await dockerService.getDashboardData();
        nsp.emit(SOCKET_EVENTS.DOCKER_STATUS, data);
      }
    } catch (err) {
      logger.error({ err }, 'Error in docker background status monitor');
    }
  }, 5000);
}
export default setupDockerSocket;
