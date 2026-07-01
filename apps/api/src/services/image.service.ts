import dockerService from '../docker/docker.service.js';
import { NotFoundError, AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import type { ImageListItem, ImageDetails, ImageHistoryItem } from '@dockverse/types';

class ImageService {
  private getClient() {
    const client = dockerService.getClient();
    if (dockerService.getStatus() === 'disconnected') {
      throw new AppError('Docker daemon is disconnected', 503, 'DOCKER_CONNECTION_ERROR');
    }
    return client;
  }

  public async listImages(): Promise<ImageListItem[]> {
    logger.debug('Listing local Docker images');
    const client = this.getClient();
    try {
      const rawImages = await client.listImages({ all: false });
      return rawImages.map((img) => ({
        id: img.Id,
        tags: img.RepoTags || [],
        size: img.Size,
        created: img.Created,
        labels: img.Labels || {},
      }));
    } catch (error) {
      logger.error({ err: error }, 'Failed to list local Docker images');
      throw new AppError('Failed to query image list from Docker Engine', 500);
    }
  }

  public async inspectImage(id: string): Promise<ImageDetails> {
    logger.debug({ id }, 'Inspecting image details');
    const client = this.getClient();
    try {
      const imageRef = client.getImage(id);
      const data = await imageRef.inspect();

      return {
        id: data.Id,
        tags: data.RepoTags || [],
        size: data.Size,
        created: data.Created,
        os: data.Os || 'linux',
        architecture: data.Architecture || 'amd64',
        author: data.Author,
        comment: data.Comment,
        dockerVersion: data.DockerVersion,
        env: (data.Config?.Env || []) as string[],
        cmd: (data.Config?.Cmd || []) as string[],
        entrypoint: (typeof data.Config?.Entrypoint === 'string' ? [data.Config?.Entrypoint] : data.Config?.Entrypoint || []) as string[],
        labels: data.Config?.Labels || {},
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new NotFoundError(`Docker image ${id} not found`);
      }
      logger.error({ err: error, id }, 'Image inspection failed');
      throw new AppError('Failed to inspect image settings', 500);
    }
  }

  public async pullImage(fromImage: string, tag: string = 'latest'): Promise<void> {
    logger.info({ fromImage, tag }, 'Pulling Docker image from registry');
    const client = this.getClient();
    
    try {
      await new Promise<void>((resolve, reject) => {
        client.createImage({ fromImage, tag }, (err: any, stream: any) => {
          if (err) {
            return reject(err);
          }
          
          client.modem.followProgress(
            stream,
            (finishErr: any, output: any) => {
              if (finishErr) {
                logger.error({ err: finishErr }, 'Image pull stream finished with error');
                reject(finishErr);
              } else {
                logger.info({ fromImage, tag }, 'Image pulled successfully');
                resolve();
              }
            },
            (progressEvent: any) => {
              // Optionally output details in debug logs
              logger.debug({ progress: progressEvent.status }, 'Pulling progress...');
            }
          );
        });
      });
    } catch (error: any) {
      logger.error({ err: error, fromImage, tag }, 'Failed to pull image');
      throw new AppError(`Failed to pull image ${fromImage}:${tag}: ${error.message || 'Unknown error'}`, 500);
    }
  }

  public async deleteImage(id: string, force: boolean = false): Promise<void> {
    logger.info({ id, force }, 'Deleting local Docker image');
    const client = this.getClient();
    try {
      const image = client.getImage(id);
      await image.remove({ force: !!force });
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new NotFoundError(`Docker image ${id} not found`);
      }
      if (error.statusCode === 409) {
        throw new AppError('Conflict: Image is currently being used by running containers. Use force option to delete.', 409, 'IMAGE_CONFLICT');
      }
      logger.error({ err: error, id }, 'Failed to remove image');
      throw new AppError(error.message || 'Failed to remove image', error.statusCode || 500);
    }
  }

  public async tagImage(id: string, repo: string, tag: string = 'latest'): Promise<void> {
    logger.info({ id, repo, tag }, 'Tagging Docker image');
    const client = this.getClient();
    try {
      const image = client.getImage(id);
      await image.tag({ repo, tag });
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new NotFoundError(`Docker image ${id} not found`);
      }
      logger.error({ err: error, id }, 'Failed to tag image');
      throw new AppError(error.message || 'Failed to tag image', error.statusCode || 500);
    }
  }

  public async getImageHistory(id: string): Promise<ImageHistoryItem[]> {
    logger.debug({ id }, 'Fetching image build layer history');
    const client = this.getClient();
    try {
      const image = client.getImage(id);
      const rawHistory = await image.history();
      return rawHistory.map((h: any) => ({
        id: h.Id || '<missing>',
        created: h.Created,
        createdBy: h.CreatedBy || '',
        size: h.Size || 0,
        tags: h.Tags || [],
      }));
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new NotFoundError(`Docker image ${id} not found`);
      }
      logger.error({ err: error, id }, 'Failed to retrieve image history');
      throw new AppError('Failed to fetch image history layers', 500);
    }
  }

  public async pruneImages(): Promise<{ spaceReclaimed: number }> {
    logger.info('Pruning unused Docker images');
    const client = this.getClient();
    try {
      const result = await client.pruneImages();
      return {
        spaceReclaimed: result.SpaceReclaimed || 0,
      };
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to prune images');
      throw new AppError('Failed to prune unused images', 500);
    }
  }
}

export const imageService = new ImageService();
export default imageService;
