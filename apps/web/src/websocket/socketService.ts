import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS, DashboardSummary } from '@dockverse/types';
import { useUIStore } from '../store/uiStore';

class SocketService {
  private socket: Socket | null = null;

  public connect(url: string = 'http://localhost:5000') {
    if (this.socket) return;

    this.socket = io(`${url}/docker`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to Docker socket namespace');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from Docker socket namespace');
      useUIStore.getState().setDockerStatus('disconnected');
    });

    this.socket.on(SOCKET_EVENTS.DOCKER_STATUS, (data: DashboardSummary) => {
      if (data && data.status) {
        useUIStore.getState().setDockerStatus(data.status);
      }
    });
  }

  public subscribeToStatus(callback: (data: DashboardSummary) => void) {
    if (!this.socket) return;
    this.socket.on(SOCKET_EVENTS.DOCKER_STATUS, callback);
  }

  public unsubscribeFromStatus(callback: (data: DashboardSummary) => void) {
    if (!this.socket) return;
    this.socket.off(SOCKET_EVENTS.DOCKER_STATUS, callback);
  }

  public requestRefresh() {
    if (!this.socket) return;
    this.socket.emit(SOCKET_EVENTS.DOCKER_REFRESH);
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
export default socketService;
