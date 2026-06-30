import { createDockerClient, Dockerode } from '@dockverse/docker-client';
import { DockerInfo, DockerStatus, DashboardSummary } from '@dockverse/types';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { DockerConnectionError } from '../utils/errors.js';

class DockerService {
  private client;
  private status: DockerStatus = 'disconnected';

  constructor() {
    this.client = createDockerClient({
      socketPath: config.DOCKER_SOCKET_PATH,
      host: config.DOCKER_HOST,
      port: config.DOCKER_PORT,
    });
    this.checkConnection().catch(() => {});
  }

  public getClient() {
    return this.client;
  }

  public async checkConnection(): Promise<DockerStatus> {
    try {
      await this.client.ping();
      this.status = 'connected';
    } catch (error) {
      this.status = 'disconnected';
      logger.debug('Docker daemon is not reachable');
    }
    return this.status;
  }

  public getStatus(): DockerStatus {
    return this.status;
  }

  public async getDockerInfo(): Promise<DockerInfo> {
    await this.checkConnection();
    if (this.status === 'disconnected') {
      throw new DockerConnectionError();
    }

    const versionInfo = await this.client.version();
    const systemInfo = await this.client.info();

    const containers = await this.client.listContainers({ all: true });
    const images = await this.client.listImages({ all: true });
    const networks = await this.client.listNetworks();
    const volumesData = await this.client.listVolumes();
    const volumesList = volumesData.Volumes || [];

    const running = containers.filter((c: Dockerode.ContainerInfo) => c.State === 'running').length;
    const paused = containers.filter((c: Dockerode.ContainerInfo) => c.State === 'paused').length;
    const stopped = containers.length - running - paused;

    return {
      system: {
        version: versionInfo.Version || 'Unknown',
        apiVersion: versionInfo.ApiVersion || 'Unknown',
        os: systemInfo.OperatingSystem || 'Unknown',
        arch: systemInfo.Architecture || 'Unknown',
        cpus: systemInfo.NCPU || 0,
        memory: systemInfo.MemTotal || 0,
        dockerRootDir: systemInfo.DockerRootDir || 'Unknown',
        uptime: undefined,
      },
      containers: {
        total: containers.length,
        running,
        stopped,
        paused,
      },
      images: {
        total: images.length,
      },
      networks: {
        total: networks.length,
      },
      volumes: {
        total: volumesList.length,
      },
    };
  }

  public async getContainerSummary() {
    await this.checkConnection();
    if (this.status === 'disconnected') throw new DockerConnectionError('Docker daemon is unreachable');
    const list = await this.client.listContainers({ all: true });
    return {
      total: list.length,
      running: list.filter((c: Dockerode.ContainerInfo) => c.State === 'running').length,
      paused: list.filter((c: Dockerode.ContainerInfo) => c.State === 'paused').length,
      stopped: list.length - list.filter((c: Dockerode.ContainerInfo) => c.State === 'running' || c.State === 'paused').length,
    };
  }

  public async getImageSummary() {
    await this.checkConnection();
    if (this.status === 'disconnected') throw new DockerConnectionError('Docker daemon is unreachable');
    const list = await this.client.listImages({ all: true });
    return {
      total: list.length,
    };
  }

  public async getNetworkSummary() {
    await this.checkConnection();
    if (this.status === 'disconnected') throw new DockerConnectionError('Docker daemon is unreachable');
    const list = await this.client.listNetworks();
    return {
      total: list.length,
    };
  }

  public async getVolumeSummary() {
    await this.checkConnection();
    if (this.status === 'disconnected') throw new DockerConnectionError('Docker daemon is unreachable');
    const list = await this.client.listVolumes();
    return {
      total: (list.Volumes || []).length,
    };
  }

  public async getDashboardData(): Promise<DashboardSummary> {
    const status = await this.checkConnection();
    let info: DockerInfo | null = null;
    if (status === 'connected') {
      try {
        info = await this.getDockerInfo();
      } catch (err) {
        logger.error({ err }, 'Failed to fetch Docker details');
      }
    }

    return {
      info,
      status,
      timestamp: new Date().toISOString(),
    };
  }
}

export const dockerService = new DockerService();
export default dockerService;
