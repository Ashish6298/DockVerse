import dockerService from '../docker/docker.service.js';
import { NotFoundError, AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import type { VolumeSummary, VolumeDetails, VolumeCreateResponse, VolumePruneResponse } from '@dockverse/types';
import { CreateVolumeInput } from '../validators/volume.validator.js';

class VolumeService {
  private getClient() {
    const client = dockerService.getClient();
    if (dockerService.getStatus() === 'disconnected') {
      throw new AppError('Docker daemon is disconnected', 503, 'DOCKER_CONNECTION_ERROR');
    }
    return client;
  }

  public async listVolumes(): Promise<VolumeSummary[]> {
    logger.debug('Listing all Docker volumes');
    const client = this.getClient();
    try {
      const rawResult = await client.listVolumes();
      const volumes = rawResult.Volumes || [];
      return volumes.map((v: any) => ({
        name: v.Name,
        driver: v.Driver || 'local',
        mountpoint: v.Mountpoint || '',
        scope: v.Scope || 'local',
        labels: v.Labels || {},
        usageData: v.UsageData ? {
          size: v.UsageData.Size || 0,
          refCount: v.UsageData.RefCount || 0,
        } : undefined,
      }));
    } catch (error) {
      logger.error({ err: error }, 'Failed to list Docker volumes');
      throw new AppError('Failed to query volume list from Docker Engine', 500);
    }
  }

  public async inspectVolume(name: string): Promise<VolumeDetails> {
    logger.debug({ name }, 'Inspecting volume details');
    const client = this.getClient();
    try {
      const volumeRef = client.getVolume(name);
      const data = await volumeRef.inspect();

      return {
        name: data.Name,
        driver: data.Driver || 'local',
        mountpoint: data.Mountpoint || '',
        scope: data.Scope || 'local',
        labels: data.Labels || {},
        options: data.Options || {},
        status: data.Status || {},
        usageData: data.UsageData ? {
          size: data.UsageData.Size || 0,
          refCount: data.UsageData.RefCount || 0,
        } : undefined,
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new NotFoundError(`Docker volume ${name} not found`);
      }
      logger.error({ err: error, name }, 'Volume inspection failed');
      throw new AppError('Failed to inspect volume settings', 500);
    }
  }

  public async createVolume(input: CreateVolumeInput): Promise<VolumeCreateResponse> {
    logger.info({ name: input.name, driver: input.driver }, 'Creating new Docker volume');
    const client = this.getClient();

    const options = {
      Name: input.name,
      Driver: input.driver || 'local',
      DriverOpts: input.driverOpts || {},
      Labels: input.labels || {},
    };

    try {
      const volume: any = await client.createVolume(options);
      const data = typeof volume.inspect === 'function' ? await volume.inspect() : volume;
      return {
        name: data.Name || data.name,
        driver: data.Driver || data.driver || 'local',
        mountpoint: data.Mountpoint || data.mountpoint || '',
        scope: data.Scope || data.scope || 'local',
        labels: data.Labels || data.labels || {},
      };
    } catch (error: any) {
      logger.error({ err: error }, 'Volume creation failed');
      throw new AppError(error.message || 'Failed to create volume', error.statusCode || 500);
    }
  }

  public async deleteVolume(name: string): Promise<void> {
    logger.info({ name }, 'Deleting Docker volume');
    const client = this.getClient();
    try {
      const volume = client.getVolume(name);
      await volume.remove();
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new NotFoundError(`Docker volume ${name} not found`);
      }
      if (error.statusCode === 409) {
        throw new AppError('Conflict: Volume is currently in use by a container. Remove container first.', 409, 'VOLUME_IN_USE');
      }
      logger.error({ err: error, name }, 'Failed to delete volume');
      throw new AppError(error.message || 'Failed to delete volume', error.statusCode || 500);
    }
  }

  public async pruneVolumes(): Promise<VolumePruneResponse> {
    logger.info('Pruning unused Docker volumes');
    const client = this.getClient();
    try {
      const result = await client.pruneVolumes();
      return {
        spaceReclaimed: result.SpaceReclaimed || 0,
        volumesDeleted: result.VolumesDeleted || [],
      };
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to prune volumes');
      throw new AppError('Failed to prune unused volumes', 500);
    }
  }
}

export const volumeService = new VolumeService();
export default volumeService;
