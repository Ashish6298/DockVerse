import dockerService from '../docker/docker.service.js';
import { AppError, NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import type {
  SecretInfo,
  ConfigInfo,
  SecretCreateRequest,
  ConfigCreateRequest,
  SecretUsageInfo,
  ConfigUsageInfo,
  SecretOperationStatus,
  ConfigOperationStatus,
  SecretsDashboardSummary
} from '@dockverse/types';

// In-memory operations status cache
const resourceOperations: Record<string, SecretOperationStatus | ConfigOperationStatus> = {};

class ResourceService {
  private getClient(): any {
    const client = dockerService.getClient();
    if (dockerService.getStatus() === 'disconnected') {
      throw new AppError('Docker daemon is disconnected', 503, 'DOCKER_CONNECTION_ERROR');
    }
    return client;
  }

  private async isSwarmActive(): Promise<boolean> {
    try {
      await this.getClient().swarmInspect();
      return true;
    } catch {
      return false;
    }
  }

  // Check if swarm is active, otherwise throw
  private async ensureSwarmActive(): Promise<void> {
    const active = await this.isSwarmActive();
    if (!active) {
      throw new AppError('Docker Swarm is not active. Secret/Config operations require an active Swarm cluster.', 400, 'SWARM_INACTIVE');
    }
  }

  // --- SECRETS MANAGEMENT ---

  public async listSecrets(): Promise<SecretInfo[]> {
    await this.ensureSwarmActive();
    const client = this.getClient();
    try {
      const secrets = await client.listSecrets();
      return secrets.map((s: any) => ({
        id: s.ID,
        version: {
          index: s.Version?.Index || 0,
        },
        createdAt: s.CreatedAt,
        updatedAt: s.UpdatedAt,
        spec: {
          name: s.Spec?.Name || '',
          labels: s.Spec?.Labels || {},
          driver: s.Spec?.Driver ? {
            name: s.Spec.Driver.Name,
            options: s.Spec.Driver.Options,
          } : undefined,
          templating: s.Spec?.Templating ? {
            name: s.Spec.Templating.Name,
            options: s.Spec.Templating.Options,
          } : undefined,
        },
      }));
    } catch (error: any) {
      logger.error({ error }, 'Failed to list secrets');
      throw new AppError(error.message || 'Failed to list secrets', 500, 'DOCKER_SECRET_ERROR');
    }
  }

  public async inspectSecret(id: string): Promise<SecretInfo> {
    await this.ensureSwarmActive();
    const client = this.getClient();
    try {
      const secret = await client.getSecret(id).inspect();
      return {
        id: secret.ID,
        version: {
          index: secret.Version?.Index || 0,
        },
        createdAt: secret.CreatedAt,
        updatedAt: secret.UpdatedAt,
        spec: {
          name: secret.Spec?.Name || '',
          labels: secret.Spec?.Labels || {},
          driver: secret.Spec?.Driver ? {
            name: secret.Spec.Driver.Name,
            options: secret.Spec.Driver.Options,
          } : undefined,
          templating: secret.Spec?.Templating ? {
            name: secret.Spec.Templating.Name,
            options: secret.Spec.Templating.Options,
          } : undefined,
        },
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new NotFoundError(`Secret ${id} not found`);
      }
      logger.error({ error, id }, 'Failed to inspect secret');
      throw new AppError(error.message || 'Failed to inspect secret', 500, 'DOCKER_SECRET_ERROR');
    }
  }

  public async checkSecretUsage(id: string): Promise<SecretUsageInfo> {
    await this.ensureSwarmActive();
    const secret = await this.inspectSecret(id);
    const client = this.getClient();

    try {
      const services = await client.listServices();
      const consumingServices: any[] = [];

      services.forEach((s: any) => {
        const secretsList = s.Spec?.TaskTemplate?.ContainerSpec?.Secrets || [];
        const isMatched = secretsList.some((sec: any) => sec.SecretID === id);
        if (isMatched) {
          consumingServices.push({
            id: s.ID,
            name: s.Spec.Name,
            replicas: s.Spec.Mode?.Replicated?.Replicas ?? 1,
            status: s.UpdateStatus?.State || 'completed',
            createdAt: s.CreatedAt,
          });
        }
      });

      return {
        secretId: id,
        secretName: secret.spec.name,
        inUse: consumingServices.length > 0,
        services: consumingServices,
      };
    } catch (err: any) {
      logger.error({ err, id }, 'Failed to inspect secret usage');
      throw new AppError(err.message || 'Failed to check secret usage', 500, 'DOCKER_SECRET_ERROR');
    }
  }

  public createSecretAsync(req: SecretCreateRequest): string {
    const client = this.getClient();
    const operationId = `create_secret_${Date.now()}`;

    resourceOperations[operationId] = {
      operationId,
      action: 'Create Docker Secret',
      status: 'running',
      progress: 20,
      logs: [`Validating secret params for ${req.name}...`],
      timestamp: new Date().toISOString(),
    } as SecretOperationStatus;

    // Check payload size (Max 500KB)
    const byteLength = Buffer.byteLength(req.data, req.isBase64 ? 'base64' : 'utf8');
    if (byteLength > 512000) {
      resourceOperations[operationId].status = 'failed';
      resourceOperations[operationId].progress = 100;
      resourceOperations[operationId].error = 'Secret payload size exceeds limit of 500KB';
      resourceOperations[operationId].logs.push('Failed: size exceeds 500KB');
      return operationId;
    }

    this.ensureSwarmActive()
      .then(async () => {
        // Duplicate check
        const list = await client.listSecrets();
        const duplicate = list.some((s: any) => s.Spec?.Name === req.name);
        if (duplicate) {
          throw new AppError(`A secret with name ${req.name} already exists`, 400, 'DUPLICATE_RESOURCE');
        }

        resourceOperations[operationId].logs.push('Base64 encoding payload value...');
        resourceOperations[operationId].progress = 50;

        let b64Data = req.data;
        if (!req.isBase64) {
          b64Data = Buffer.from(req.data, 'utf8').toString('base64');
        }

        const opt = {
          Name: req.name,
          Labels: req.labels || {},
          Data: b64Data,
        };

        resourceOperations[operationId].logs.push(`Requesting secret creation from Swarm engine...`);
        const result = await client.createSecret(opt);
        
        resourceOperations[operationId].status = 'success';
        resourceOperations[operationId].progress = 100;
        resourceOperations[operationId].logs.push(`Secret created successfully. ID: ${result.id || result.ID}`);
      })
      .catch((err: any) => {
        logger.error({ err }, 'Failed to create secret');
        resourceOperations[operationId].status = 'failed';
        resourceOperations[operationId].progress = 100;
        resourceOperations[operationId].error = err.message || 'Creation failed';
        resourceOperations[operationId].logs.push(`Failed: ${err.message || 'Creation failed'}`);
      });

    return operationId;
  }

  public removeSecretAsync(id: string, force = false): string {
    const client = this.getClient();
    const operationId = `remove_secret_${Date.now()}`;

    resourceOperations[operationId] = {
      operationId,
      action: `Delete Secret ${id}`,
      status: 'running',
      progress: 30,
      logs: [`Checking usage references for secret ID ${id}...`],
      timestamp: new Date().toISOString(),
    } as SecretOperationStatus;

    this.ensureSwarmActive()
      .then(async () => {
        const usage = await this.checkSecretUsage(id);
        if (usage.inUse && !force) {
          throw new AppError(`Secret is currently attached to services: ${usage.services.map((s) => s.name).join(', ')}`, 400, 'RESOURCE_IN_USE');
        }

        resourceOperations[operationId].logs.push(`Removing secret from Swarm engine...`);
        resourceOperations[operationId].progress = 70;

        await client.getSecret(id).remove();

        resourceOperations[operationId].status = 'success';
        resourceOperations[operationId].progress = 100;
        resourceOperations[operationId].logs.push('Secret removed successfully.');
      })
      .catch((err: any) => {
        logger.error({ err, id }, 'Failed to remove secret');
        resourceOperations[operationId].status = 'failed';
        resourceOperations[operationId].progress = 100;
        resourceOperations[operationId].error = err.message || 'Removal failed';
        resourceOperations[operationId].logs.push(`Failed: ${err.message || 'Removal failed'}`);
      });

    return operationId;
  }

  // --- CONFIGS MANAGEMENT ---

  public async listConfigs(): Promise<ConfigInfo[]> {
    await this.ensureSwarmActive();
    const client = this.getClient();
    try {
      const configs = await client.listConfigs();
      return configs.map((c: any) => ({
        id: c.ID,
        version: {
          index: c.Version?.Index || 0,
        },
        createdAt: c.CreatedAt,
        updatedAt: c.UpdatedAt,
        spec: {
          name: c.Spec?.Name || '',
          labels: c.Spec?.Labels || {},
          templating: c.Spec?.Templating ? {
            name: c.Spec.Templating.Name,
            options: c.Spec.Templating.Options,
          } : undefined,
        },
      }));
    } catch (error: any) {
      logger.error({ error }, 'Failed to list configs');
      throw new AppError(error.message || 'Failed to list configs', 500, 'DOCKER_CONFIG_ERROR');
    }
  }

  public async inspectConfig(id: string): Promise<ConfigInfo> {
    await this.ensureSwarmActive();
    const client = this.getClient();
    try {
      const config = await client.getConfig(id).inspect();
      return {
        id: config.ID,
        version: {
          index: config.Version?.Index || 0,
        },
        createdAt: config.CreatedAt,
        updatedAt: config.UpdatedAt,
        spec: {
          name: config.Spec?.Name || '',
          labels: config.Spec?.Labels || {},
          templating: config.Spec?.Templating ? {
            name: config.Spec.Templating.Name,
            options: config.Spec.Templating.Options,
          } : undefined,
        },
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new NotFoundError(`Config ${id} not found`);
      }
      logger.error({ error, id }, 'Failed to inspect config');
      throw new AppError(error.message || 'Failed to inspect config', 500, 'DOCKER_CONFIG_ERROR');
    }
  }

  public async checkConfigUsage(id: string): Promise<ConfigUsageInfo> {
    await this.ensureSwarmActive();
    const config = await this.inspectConfig(id);
    const client = this.getClient();

    try {
      const services = await client.listServices();
      const consumingServices: any[] = [];

      services.forEach((s: any) => {
        const configsList = s.Spec?.TaskTemplate?.ContainerSpec?.Configs || [];
        const isMatched = configsList.some((cfg: any) => cfg.ConfigID === id);
        if (isMatched) {
          consumingServices.push({
            id: s.ID,
            name: s.Spec.Name,
            replicas: s.Spec.Mode?.Replicated?.Replicas ?? 1,
            status: s.UpdateStatus?.State || 'completed',
            createdAt: s.CreatedAt,
          });
        }
      });

      return {
        configId: id,
        configName: config.spec.name,
        inUse: consumingServices.length > 0,
        services: consumingServices,
      };
    } catch (err: any) {
      logger.error({ err, id }, 'Failed to inspect config usage');
      throw new AppError(err.message || 'Failed to check config usage', 500, 'DOCKER_CONFIG_ERROR');
    }
  }

  public createConfigAsync(req: ConfigCreateRequest): string {
    const client = this.getClient();
    const operationId = `create_config_${Date.now()}`;

    resourceOperations[operationId] = {
      operationId,
      action: 'Create Docker Config',
      status: 'running',
      progress: 20,
      logs: [`Validating config params for ${req.name}...`],
      timestamp: new Date().toISOString(),
    } as ConfigOperationStatus;

    // Check size limit (Max 500KB)
    const byteLength = Buffer.byteLength(req.data, 'utf8');
    if (byteLength > 512000) {
      resourceOperations[operationId].status = 'failed';
      resourceOperations[operationId].progress = 100;
      resourceOperations[operationId].error = 'Config payload size exceeds limit of 500KB';
      resourceOperations[operationId].logs.push('Failed: size exceeds 500KB');
      return operationId;
    }

    this.ensureSwarmActive()
      .then(async () => {
        // Duplicate check
        const list = await client.listConfigs();
        const duplicate = list.some((c: any) => c.Spec?.Name === req.name);
        if (duplicate) {
          throw new AppError(`A config with name ${req.name} already exists`, 400, 'DUPLICATE_RESOURCE');
        }

        resourceOperations[operationId].logs.push('Base64 encoding configuration content...');
        resourceOperations[operationId].progress = 50;

        const b64Data = Buffer.from(req.data, 'utf8').toString('base64');
        const opt = {
          Name: req.name,
          Labels: req.labels || {},
          Data: b64Data,
        };

        resourceOperations[operationId].logs.push(`Requesting config creation from Swarm engine...`);
        const result = await client.createConfig(opt);

        resourceOperations[operationId].status = 'success';
        resourceOperations[operationId].progress = 100;
        resourceOperations[operationId].logs.push(`Config created successfully. ID: ${result.id || result.ID}`);
      })
      .catch((err: any) => {
        logger.error({ err }, 'Failed to create config');
        resourceOperations[operationId].status = 'failed';
        resourceOperations[operationId].progress = 100;
        resourceOperations[operationId].error = err.message || 'Creation failed';
        resourceOperations[operationId].logs.push(`Failed: ${err.message || 'Creation failed'}`);
      });

    return operationId;
  }

  public removeConfigAsync(id: string, force = false): string {
    const client = this.getClient();
    const operationId = `remove_config_${Date.now()}`;

    resourceOperations[operationId] = {
      operationId,
      action: `Delete Config ${id}`,
      status: 'running',
      progress: 30,
      logs: [`Checking usage references for config ID ${id}...`],
      timestamp: new Date().toISOString(),
    } as ConfigOperationStatus;

    this.ensureSwarmActive()
      .then(async () => {
        const usage = await this.checkConfigUsage(id);
        if (usage.inUse && !force) {
          throw new AppError(`Config is currently attached to services: ${usage.services.map((s) => s.name).join(', ')}`, 400, 'RESOURCE_IN_USE');
        }

        resourceOperations[operationId].logs.push(`Removing config from Swarm engine...`);
        resourceOperations[operationId].progress = 70;

        await client.getConfig(id).remove();

        resourceOperations[operationId].status = 'success';
        resourceOperations[operationId].progress = 100;
        resourceOperations[operationId].logs.push('Config removed successfully.');
      })
      .catch((err: any) => {
        logger.error({ err, id }, 'Failed to remove config');
        resourceOperations[operationId].status = 'failed';
        resourceOperations[operationId].progress = 100;
        resourceOperations[operationId].error = err.message || 'Removal failed';
        resourceOperations[operationId].logs.push(`Failed: ${err.message || 'Removal failed'}`);
      });

    return operationId;
  }

  // --- GENERAL TELEMETRY & HISTORIES ---

  public async getDashboardSummary(): Promise<SecretsDashboardSummary> {
    const swarmActive = await this.isSwarmActive();
    if (!swarmActive) {
      return {
        totalSecrets: 0,
        totalConfigs: 0,
        attachedSecrets: 0,
        attachedConfigs: 0,
        unusedSecrets: 0,
        unusedConfigs: 0,
        recentOperationsCount: 0,
        swarmActive: false,
      };
    }

    try {
      const secrets = await this.listSecrets();
      const configs = await this.listConfigs();
      const client = this.getClient();
      const services = await client.listServices();

      let attachedSecrets = 0;
      let attachedConfigs = 0;

      const secretsInUseSet = new Set<string>();
      const configsInUseSet = new Set<string>();

      services.forEach((s: any) => {
        const secList = s.Spec?.TaskTemplate?.ContainerSpec?.Secrets || [];
        const cfgList = s.Spec?.TaskTemplate?.ContainerSpec?.Configs || [];
        secList.forEach((sec: any) => secretsInUseSet.add(sec.SecretID));
        cfgList.forEach((cfg: any) => configsInUseSet.add(cfg.ConfigID));
      });

      attachedSecrets = secrets.filter((s) => secretsInUseSet.has(s.id)).length;
      attachedConfigs = configs.filter((c) => configsInUseSet.has(c.id)).length;

      const recentOperationsCount = Object.keys(resourceOperations).length;

      return {
        totalSecrets: secrets.length,
        totalConfigs: configs.length,
        attachedSecrets,
        attachedConfigs,
        unusedSecrets: secrets.length - attachedSecrets,
        unusedConfigs: configs.length - attachedConfigs,
        recentOperationsCount,
        swarmActive: true,
      };
    } catch {
      return {
        totalSecrets: 0,
        totalConfigs: 0,
        attachedSecrets: 0,
        attachedConfigs: 0,
        unusedSecrets: 0,
        unusedConfigs: 0,
        recentOperationsCount: 0,
        swarmActive: true,
      };
    }
  }

  public getOperation(operationId: string): SecretOperationStatus | ConfigOperationStatus {
    const op = resourceOperations[operationId];
    if (!op) {
      throw new NotFoundError(`Resource operation ${operationId} not found`);
    }
    return op;
  }

  public getOperationsHistory(): Array<SecretOperationStatus | ConfigOperationStatus> {
    return Object.values(resourceOperations).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}

export const resourceService = new ResourceService();
export default resourceService;
