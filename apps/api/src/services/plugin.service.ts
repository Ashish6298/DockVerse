import dockerService from '../docker/docker.service.js';
import { AppError, NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import type {
  PluginListItem,
  PluginDetails,
  PluginPrivilege,
  PluginInstallRequest,
  PluginConfigureRequest,
  PluginOperationResponse
} from '@dockverse/types';

// In-memory operations store
const pluginOperations: Record<string, {
  operationId: string;
  status: 'running' | 'success' | 'failed';
  logs: string[];
  error?: string;
}> = {};

class PluginService {
  private getClient(): any {
    const client = dockerService.getClient();
    if (dockerService.getStatus() === 'disconnected') {
      throw new AppError('Docker daemon is disconnected', 503, 'DOCKER_CONNECTION_ERROR');
    }
    return client;
  }

  public async listPlugins(): Promise<PluginListItem[]> {
    const client = this.getClient();
    try {
      const plugins = await client.listPlugins();
      return plugins.map((p: any) => ({
        Id: p.Id,
        Name: p.Name,
        Active: p.Enabled,
        Enabled: p.Enabled,
        Config: {
          DockerVersion: p.Config?.DockerVersion,
          Description: p.Config?.Description,
          Documentation: p.Config?.Documentation,
          Interface: p.Config?.Interface ? {
            Types: p.Config.Interface.Types || [],
            Socket: p.Config.Interface.Socket || ''
          } : undefined,
          Entrypoint: p.Config?.Entrypoint,
          WorkDir: p.Config?.WorkDir,
          Env: p.Config?.Env?.map((e: any) => ({
            Name: e.Name,
            Description: e.Description,
            Settable: e.Settable || [],
            Value: e.Value
          })),
          Mounts: p.Config?.Mounts?.map((m: any) => ({
            Name: m.Name,
            Description: m.Description,
            Settable: m.Settable || [],
            Source: m.Source,
            Destination: m.Destination,
            Type: m.Type,
            Options: m.Options || []
          })),
          Devices: p.Config?.Devices?.map((d: any) => ({
            Name: d.Name,
            Description: d.Description,
            Settable: d.Settable || [],
            Path: d.Path
          }))
        }
      }));
    } catch (error: any) {
      logger.error({ error }, 'Failed to list plugins');
      throw new AppError(error.message || 'Failed to list plugins', 500, 'DOCKER_PLUGIN_ERROR');
    }
  }

  public async inspectPlugin(nameOrId: string): Promise<PluginDetails> {
    const client = this.getClient();
    try {
      const plugin = client.getPlugin(nameOrId, undefined);
      const detail: any = await plugin.inspect();
      
      // Fetch plugin privileges
      let privileges: PluginPrivilege[] = [];
      try {
        privileges = await client.getPluginPrivileges(detail.Name);
      } catch {
        // Fallback or ignore if cannot fetch remote privileges
      }

      return {
        Id: detail.Id,
        Name: detail.Name,
        Active: detail.Enabled,
        Enabled: detail.Enabled,
        Privileges: privileges,
        Config: {
          DockerVersion: detail.Config?.DockerVersion,
          Description: detail.Config?.Description,
          Documentation: detail.Config?.Documentation,
          Interface: detail.Config?.Interface ? {
            Types: detail.Config.Interface.Types || [],
            Socket: detail.Config.Interface.Socket || ''
          } : undefined,
          Entrypoint: detail.Config?.Entrypoint,
          WorkDir: detail.Config?.WorkDir,
          Env: detail.Config?.Env?.map((e: any) => ({
            Name: e.Name,
            Description: e.Description,
            Settable: e.Settable || [],
            Value: e.Value
          })),
          Mounts: detail.Config?.Mounts?.map((m: any) => ({
            Name: m.Name,
            Description: m.Description,
            Settable: m.Settable || [],
            Source: m.Source,
            Destination: m.Destination,
            Type: m.Type,
            Options: m.Options || []
          })),
          Devices: detail.Config?.Devices?.map((d: any) => ({
            Name: d.Name,
            Description: d.Description,
            Settable: d.Settable || [],
            Path: d.Path
          }))
        }
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new NotFoundError(`Plugin ${nameOrId} not found`);
      }
      logger.error({ error, nameOrId }, 'Failed to inspect plugin');
      throw new AppError(error.message || 'Failed to inspect plugin', 500, 'DOCKER_PLUGIN_ERROR');
    }
  }

  public async getPluginPrivileges(remoteName: string): Promise<PluginPrivilege[]> {
    const client = this.getClient();
    try {
      return await client.getPluginPrivileges(remoteName);
    } catch (error: any) {
      logger.error({ error, remoteName }, 'Failed to get plugin privileges');
      throw new AppError(error.message || 'Failed to retrieve plugin privileges', 500, 'DOCKER_PLUGIN_ERROR');
    }
  }

  public installPlugin(req: PluginInstallRequest): string {
    const client = this.getClient();
    const operationId = Date.now().toString();

    pluginOperations[operationId] = {
      operationId,
      status: 'running',
      logs: [`Initiating plugin installation: ${req.remoteName}`]
    };

    // Prepare options
    const privileges = req.grantPrivileges ? [] : null; // In dockerode, privileges check is passed or empty
    const opts: any = {};
    if (req.alias) opts.name = req.alias;

    // Fetch privileges dynamically if we need to pass them
    client.getPluginPrivileges(req.remoteName).then((fetchedPrivileges: any) => {
      pluginOperations[operationId].logs.push(`Retrieved privileges: ${JSON.stringify(fetchedPrivileges)}`);
      
      const payloadPrivileges = req.grantPrivileges ? fetchedPrivileges : [];

      client.installPlugin(req.remoteName, {
        name: req.alias || req.remoteName,
        body: payloadPrivileges
      }, (err: any, stream: any) => {
        if (err) {
          logger.error({ err, remoteName: req.remoteName }, 'Failed to initiate plugin install stream');
          pluginOperations[operationId].status = 'failed';
          pluginOperations[operationId].error = err.message;
          pluginOperations[operationId].logs.push(`Installation error: ${err.message}`);
          return;
        }

        client.modem.followProgress(
          stream,
          (finishErr: any) => {
            if (finishErr) {
              logger.error({ err: finishErr, operationId }, 'Plugin install failed');
              pluginOperations[operationId].status = 'failed';
              pluginOperations[operationId].error = finishErr.message || 'Stream closed';
              pluginOperations[operationId].logs.push(`Installation failed: ${finishErr.message || 'Stream closed'}`);
            } else {
              logger.info({ operationId }, 'Plugin installation completed successfully');
              pluginOperations[operationId].status = 'success';
              pluginOperations[operationId].logs.push(`Plugin ${req.remoteName} installed successfully.`);
            }
          },
          (progressEvent: any) => {
            if (progressEvent.status) {
              let logMsg = progressEvent.status;
              if (progressEvent.progress) {
                logMsg += ` - ${progressEvent.progress}`;
              }
              pluginOperations[operationId].logs.push(logMsg);
            } else if (progressEvent.stream) {
              pluginOperations[operationId].logs.push(progressEvent.stream.trim());
            }
          }
        );
      });
    }).catch((privErr: any) => {
      logger.error({ privErr }, 'Failed to verify plugin privileges for installation');
      pluginOperations[operationId].status = 'failed';
      pluginOperations[operationId].error = privErr.message;
      pluginOperations[operationId].logs.push(`Privilege verification failed: ${privErr.message}`);
    });

    return operationId;
  }

  public async enablePlugin(nameOrId: string): Promise<void> {
    const client = this.getClient();
    try {
      const plugin = client.getPlugin(nameOrId, undefined);
      await plugin.enable({ timeout: 30 });
    } catch (error: any) {
      logger.error({ error, nameOrId }, 'Failed to enable plugin');
      throw new AppError(error.message || 'Failed to enable plugin', 500, 'DOCKER_PLUGIN_ERROR');
    }
  }

  public async disablePlugin(nameOrId: string, force = false): Promise<void> {
    const client = this.getClient();
    try {
      const plugin = client.getPlugin(nameOrId, undefined);
      await plugin.disable({ force });
    } catch (error: any) {
      logger.error({ error, nameOrId }, 'Failed to disable plugin');
      throw new AppError(error.message || 'Failed to disable plugin', 500, 'DOCKER_PLUGIN_ERROR');
    }
  }

  public async configurePlugin(nameOrId: string, req: PluginConfigureRequest): Promise<void> {
    const client = this.getClient();
    try {
      const plugin = client.getPlugin(nameOrId, undefined);
      const envList = req.env ? Object.entries(req.env).map(([k, v]) => `${k}=${v}`) : [];
      await plugin.configure(envList);
    } catch (error: any) {
      logger.error({ error, nameOrId }, 'Failed to configure plugin');
      throw new AppError(error.message || 'Failed to configure plugin', 500, 'DOCKER_PLUGIN_ERROR');
    }
  }

  public upgradePlugin(nameOrId: string, req: { remoteName: string; grantPrivileges: boolean }): string {
    const client = this.getClient();
    const operationId = Date.now().toString();

    pluginOperations[operationId] = {
      operationId,
      status: 'running',
      logs: [`Initiating plugin upgrade for ${nameOrId} to remote repository ${req.remoteName}`]
    };

    client.getPluginPrivileges(req.remoteName).then((fetchedPrivileges: any) => {
      const payloadPrivileges = req.grantPrivileges ? fetchedPrivileges : [];
      const plugin = client.getPlugin(nameOrId, undefined);

      plugin.upgrade({
        remote: req.remoteName,
        body: payloadPrivileges
      }, (err: any, stream: any) => {
        if (err) {
          logger.error({ err, nameOrId }, 'Failed to initiate plugin upgrade stream');
          pluginOperations[operationId].status = 'failed';
          pluginOperations[operationId].error = err.message;
          pluginOperations[operationId].logs.push(`Upgrade error: ${err.message}`);
          return;
        }

        client.modem.followProgress(
          stream,
          (finishErr: any) => {
            if (finishErr) {
              logger.error({ err: finishErr, operationId }, 'Plugin upgrade failed');
              pluginOperations[operationId].status = 'failed';
              pluginOperations[operationId].error = finishErr.message || 'Stream closed';
              pluginOperations[operationId].logs.push(`Upgrade failed: ${finishErr.message || 'Stream closed'}`);
            } else {
              logger.info({ operationId }, 'Plugin upgrade completed successfully');
              pluginOperations[operationId].status = 'success';
              pluginOperations[operationId].logs.push(`Plugin ${nameOrId} upgraded successfully to ${req.remoteName}.`);
            }
          },
          (progressEvent: any) => {
            if (progressEvent.status) {
              let logMsg = progressEvent.status;
              if (progressEvent.progress) {
                logMsg += ` - ${progressEvent.progress}`;
              }
              pluginOperations[operationId].logs.push(logMsg);
            }
          }
        );
      });
    }).catch((privErr: any) => {
      logger.error({ privErr }, 'Failed to verify plugin privileges for upgrade');
      pluginOperations[operationId].status = 'failed';
      pluginOperations[operationId].error = privErr.message;
      pluginOperations[operationId].logs.push(`Privilege verification failed: ${privErr.message}`);
    });

    return operationId;
  }

  public async removePlugin(nameOrId: string, force = false): Promise<void> {
    const client = this.getClient();
    try {
      const plugin = client.getPlugin(nameOrId, undefined);
      await plugin.remove({ force });
    } catch (error: any) {
      logger.error({ error, nameOrId }, 'Failed to remove plugin');
      throw new AppError(error.message || 'Failed to remove plugin', 500, 'DOCKER_PLUGIN_ERROR');
    }
  }


  public getOperation(operationId: string): PluginOperationResponse {
    const operation = pluginOperations[operationId];
    if (!operation) {
      throw new NotFoundError(`Plugin operation ${operationId} not found`);
    }
    return operation;
  }
}

export const pluginService = new PluginService();
export default pluginService;
