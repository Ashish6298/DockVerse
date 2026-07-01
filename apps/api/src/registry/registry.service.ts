import dockerService from '../docker/docker.service.js';
import { AppError, NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import type {
  RegistryProvider,
  RegistryRepository,
  RegistryTag,
  RegistryManifest,
  RegistryOperation,
  RegistryAuthentication,
  RegistrySearchResult,
  RegistryHealth,
  RegistryRateLimit
} from '@dockverse/types';

// In-memory registry operations progress store
const registryOperations: Record<string, {
  operationId: string;
  status: 'running' | 'success' | 'failed';
  logs: string[];
  error?: string;
}> = {};

// In-memory session auth credentials cache
const sessionAuths: Record<string, RegistryAuthentication> = {};

class RegistryService {
  private getClient() {
    const client = dockerService.getClient();
    if (dockerService.getStatus() === 'disconnected') {
      throw new AppError('Docker daemon is disconnected', 503, 'DOCKER_CONNECTION_ERROR');
    }
    return client;
  }

  public getProviders(): RegistryProvider[] {
    return [
      { id: 'dockerhub', name: 'Docker Hub', description: 'Official Docker Hub registry registry', status: sessionAuths['dockerhub'] ? 'connected' : 'disconnected', url: 'https://index.docker.io/v1/' },
      { id: 'ghcr', name: 'GitHub Container Registry', description: 'GitHub Packages OCI Registry container space', status: sessionAuths['ghcr'] ? 'connected' : 'disconnected', url: 'https://ghcr.io' },
      { id: 'harbor', name: 'Harbor Registry', description: 'Enterprise private registry with vulnerability scans', status: sessionAuths['harbor'] ? 'connected' : 'disconnected', url: 'https://harbor.local' },
      { id: 'quay', name: 'Quay.io', description: 'Red Hat Quay secure container registry catalog', status: sessionAuths['quay'] ? 'connected' : 'disconnected', url: 'https://quay.io' },
      { id: 'acr', name: 'Azure Container Registry', description: 'Private registry hosted on Microsoft Azure platform', status: sessionAuths['acr'] ? 'connected' : 'disconnected', url: '' },
      { id: 'ecr', name: 'Amazon ECR', description: 'Amazon Elastic Container Registry repository spaces', status: sessionAuths['ecr'] ? 'connected' : 'disconnected', url: '' },
      { id: 'gar', name: 'Google Artifact Registry', description: 'Google Cloud secure packaging artifact registry', status: sessionAuths['gar'] ? 'connected' : 'disconnected', url: '' }
    ];
  }

  public login(providerId: string, username: string, token: string): RegistryAuthentication {
    logger.info({ providerId, username }, 'Registry authentication initiated');
    sessionAuths[providerId] = { username, token };
    return { username };
  }

  public logout(providerId: string): void {
    logger.info({ providerId }, 'Registry authentication revoked');
    delete sessionAuths[providerId];
  }

  public getAuthStatus(providerId: string): RegistryAuthentication {
    const auth = sessionAuths[providerId];
    if (!auth) {
      return {};
    }
    return { username: auth.username };
  }

  public searchRepositories(query: string): RegistrySearchResult {
    const list: RegistryRepository[] = [
      { name: 'nginx', namespace: 'library', description: 'Official build of Nginx web server engine', starsCount: 18500, pullsCount: 10000000 },
      { name: 'node', namespace: 'library', description: 'Node.js JavaScript runtime environment stack', starsCount: 12400, pullsCount: 8900000 },
      { name: 'postgres', namespace: 'library', description: 'PostgreSQL relational database server engine', starsCount: 11200, pullsCount: 7500000 },
      { name: 'redis', namespace: 'library', description: 'Redis memory cache and key-value store database', starsCount: 10900, pullsCount: 6800000 },
      { name: 'ubuntu', namespace: 'library', description: 'Ubuntu official operating system base layer', starsCount: 15400, pullsCount: 9500000 },
      { name: 'python', namespace: 'library', description: 'Python programming language compiler runtimes', starsCount: 9300, pullsCount: 5200000 }
    ];

    const filtered = list.filter(r => r.name.toLowerCase().includes(query.toLowerCase()));
    return {
      totalCount: filtered.length,
      repositories: filtered
    };
  }

  public getTags(repository: string): RegistryTag[] {
    return [
      { name: 'latest', digest: 'sha256:d84cf3a0c5cd6d56df935d21415df8f9fcdbbdbd3184cd29023412ad01fecbbd', sizeBytes: 142000000, lastUpdated: new Date().toISOString() },
      { name: 'alpine', digest: 'sha256:fecbbd3184cd29023412ad01fecbbdd84cf3a0c5cd6d56df935d21415df8f9f', sizeBytes: 48000000, lastUpdated: new Date().toISOString() },
      { name: '1.25-alpine', digest: 'sha256:15df8f9fcdbbdbd3184cd29023412ad01fecbbdfecbbd3184cd29023412ad0', sizeBytes: 47800000, lastUpdated: new Date().toISOString() },
      { name: '1.24', digest: 'sha256:e0b57117180373dfd28c39352c3c2b8c9cdbbdbd3184cd29023412ad01fecbb', sizeBytes: 139000000, lastUpdated: new Date().toISOString() }
    ];
  }

  public getManifest(repository: string, tag: string): RegistryManifest {
    return {
      schemaVersion: 2,
      mediaType: 'application/vnd.docker.distribution.manifest.v2+json',
      configDigest: 'sha256:d84cf3a0c5cd6d56df935d21415df8f9fcdbbdbd3184cd29023412ad01fecbbd',
      layers: [
        { mediaType: 'application/vnd.docker.image.rootfs.diff.tar.gzip', digest: 'sha256:ecbbd3184cd29023412ad01fecbbd', sizeBytes: 28000000 },
        { mediaType: 'application/vnd.docker.image.rootfs.diff.tar.gzip', digest: 'sha256:15df8f9fcdbbdbd3184cd29023412ad0', sizeBytes: 15000000 },
        { mediaType: 'application/vnd.docker.image.rootfs.diff.tar.gzip', digest: 'sha256:12ad01fecbbdfecbbd3184cd29023412ad0', sizeBytes: 5000000 }
      ]
    };
  }

  public startPull(imageName: string, tag: string): string {
    const client = this.getClient();
    const operationId = Date.now().toString();
    const fullImageName = `${imageName}:${tag}`;

    registryOperations[operationId] = {
      operationId,
      status: 'running',
      logs: [`Initiating pull request for image: ${fullImageName}`]
    };

    client.pull(fullImageName, {}, (err: any, stream: any) => {
      if (err) {
        logger.error({ err, imageName }, 'Failed to initiate registry pull stream');
        registryOperations[operationId].status = 'failed';
        registryOperations[operationId].error = err.message;
        registryOperations[operationId].logs.push(`Pull initialization error: ${err.message}`);
        return;
      }

      client.modem.followProgress(
        stream,
        (finishErr: any) => {
          if (finishErr) {
            logger.error({ err: finishErr, operationId }, 'Registry pull failed');
            registryOperations[operationId].status = 'failed';
            registryOperations[operationId].error = finishErr.message || 'Stream closed';
            registryOperations[operationId].logs.push(`Pull finished with error: ${finishErr.message || 'Stream closed'}`);
          } else {
            logger.info({ operationId }, 'Registry image pull completed');
            registryOperations[operationId].status = 'success';
            registryOperations[operationId].logs.push(`Image ${fullImageName} pulled successfully.`);
          }
        },
        (progressEvent: any) => {
          if (progressEvent.status) {
            let logMsg = progressEvent.status;
            if (progressEvent.progress) {
              logMsg += ` - ${progressEvent.progress}`;
            }
            registryOperations[operationId].logs.push(logMsg);
          }
        }
      );
    });

    return operationId;
  }

  public startPush(imageName: string, tag: string): string {
    const client = this.getClient();
    const operationId = Date.now().toString();
    const fullImageName = `${imageName}:${tag}`;

    registryOperations[operationId] = {
      operationId,
      status: 'running',
      logs: [`Initiating push request for image: ${fullImageName}`]
    };

    const image = client.getImage(fullImageName);
    image.push({ tag }, (err: any, stream: any) => {
      if (err) {
        logger.error({ err, imageName }, 'Failed to initiate registry push stream');
        registryOperations[operationId].status = 'failed';
        registryOperations[operationId].error = err.message;
        registryOperations[operationId].logs.push(`Push initialization error: ${err.message}`);
        return;
      }

      client.modem.followProgress(
        stream,
        (finishErr: any) => {
          if (finishErr) {
            logger.error({ err: finishErr, operationId }, 'Registry push failed');
            registryOperations[operationId].status = 'failed';
            registryOperations[operationId].error = finishErr.message || 'Stream closed';
            registryOperations[operationId].logs.push(`Push finished with error: ${finishErr.message || 'Stream closed'}`);
          } else {
            logger.info({ operationId }, 'Registry image push completed');
            registryOperations[operationId].status = 'success';
            registryOperations[operationId].logs.push(`Image ${fullImageName} pushed successfully.`);
          }
        },
        (progressEvent: any) => {
          if (progressEvent.status) {
            let logMsg = progressEvent.status;
            if (progressEvent.progress) {
              logMsg += ` - ${progressEvent.progress}`;
            }
            registryOperations[operationId].logs.push(logMsg);
          }
        }
      );
    });

    return operationId;
  }

  public getOperationProgress(operationId: string): RegistryOperation {
    const op = registryOperations[operationId];
    if (!op) {
      throw new NotFoundError(`Registry operation ID ${operationId} not found`);
    }
    return op;
  }

  public getRateLimit(): RegistryRateLimit {
    return {
      limit: 100,
      remaining: 98,
      resetTime: new Date(Date.now() + 3600000).toISOString()
    };
  }

  public getHealth(): RegistryHealth {
    return { status: 'ok' };
  }
}

export const registryService = new RegistryService();
export default registryService;
