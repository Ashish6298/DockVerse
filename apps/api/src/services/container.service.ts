import dockerService from '../docker/docker.service.js';
import { NotFoundError, AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import type { ContainerListItem, ContainerDetails } from '@dockverse/types';
import { CreateContainerInput } from '../validators/container.validator.js';

class ContainerService {
  private getClient() {
    const client = dockerService.getClient();
    if (dockerService.getStatus() === 'disconnected') {
      throw new AppError('Docker daemon is disconnected', 503, 'DOCKER_CONNECTION_ERROR');
    }
    return client;
  }

  public async listContainers(): Promise<ContainerListItem[]> {
    logger.debug('Listing all Docker containers');
    const client = this.getClient();
    try {
      const rawContainers = await client.listContainers({ all: true });
      return rawContainers.map((c) => {
        const ports = (c.Ports || []).map((p) => ({
          ip: p.IP,
          privatePort: p.PrivatePort,
          publicPort: p.PublicPort,
          type: p.Type,
        }));

        return {
          id: c.Id,
          name: c.Names[0]?.replace(/^\//, '') || c.Id.slice(0, 12),
          image: c.Image,
          command: c.Command,
          created: c.Created,
          state: c.State,
          status: c.Status,
          ports,
          labels: c.Labels || {},
        };
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to list Docker containers');
      throw new AppError('Failed to query container list from Docker Engine', 500);
    }
  }

  public async inspectContainer(id: string): Promise<ContainerDetails> {
    logger.debug({ id }, 'Inspecting container details');
    const client = this.getClient();
    try {
      const containerRef = client.getContainer(id);
      const data = await containerRef.inspect();

      return {
        id: data.Id,
        name: data.Name.replace(/^\//, ''),
        image: data.Config.Image,
        created: data.Created,
        state: {
          status: data.State.Status,
          running: data.State.Running,
          paused: data.State.Paused,
          restarting: data.State.Restarting,
          oOMKilled: data.State.OOMKilled,
          dead: data.State.Dead,
          exitCode: data.State.ExitCode,
          error: data.State.Error,
          startedAt: data.State.StartedAt,
          finishedAt: data.State.FinishedAt,
          health: data.State.Health ? {
            status: data.State.Health.Status,
            failingStreak: data.State.Health.FailingStreak,
            log: (data.State.Health.Log || []).map((l: any) => ({
              start: l.Start,
              end: l.End,
              exitCode: l.ExitCode,
              output: l.Output,
            })),
          } : undefined,
        },
        env: data.Config.Env || [],
        mounts: (data.Mounts || []).map((m: any) => ({
          type: m.Type,
          name: m.Name,
          source: m.Source,
          destination: m.Destination,
          driver: m.Driver,
          mode: m.Mode,
          rw: m.RW,
        })),
        networks: Object.entries(data.NetworkSettings.Networks || {}).reduce((acc, [key, val]: [string, any]) => {
          acc[key] = {
            gateway: val.Gateway,
            ipAddress: val.IPAddress,
            macAddress: val.MacAddress,
            aliases: val.Aliases,
          };
          return acc;
        }, {} as ContainerDetails['networks']),
        ports: Object.entries(data.NetworkSettings.Ports || {}).reduce((acc, [key, val]: [string, any]) => {
          acc[key] = (val || []).map((p: any) => ({
            HostIp: p.HostIp,
            HostPort: p.HostPort,
          }));
          return acc;
        }, {} as ContainerDetails['ports']),
        restartPolicy: {
          name: data.HostConfig?.RestartPolicy?.Name || '',
          maximumRetryCount: data.HostConfig?.RestartPolicy?.MaximumRetryCount || 0,
        },
        labels: data.Config?.Labels || {},
        limits: {
          memory: data.HostConfig?.Memory || 0,
          nanoCpus: data.HostConfig?.NanoCpus || 0,
        },
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new NotFoundError(`Container with ID or name ${id} was not found`);
      }
      logger.error({ err: error, id }, 'Container inspection failed');
      throw new AppError('Failed to inspect container settings', 500);
    }
  }

  public async createContainer(input: CreateContainerInput): Promise<{ id: string }> {
    logger.info({ image: input.image, name: input.name }, 'Creating new Docker container');
    const client = this.getClient();
    
    // Bind port mappings if defined
    const portBindings: Record<string, any> = {};
    const exposedPorts: Record<string, any> = {};
    if (input.ports) {
      for (const p of input.ports) {
        const containerPortStr = `${p.containerPort}/tcp`;
        exposedPorts[containerPortStr] = {};
        portBindings[containerPortStr] = [{ HostPort: p.hostPort.toString() }];
      }
    }

    try {
      const container = await client.createContainer({
        name: input.name,
        Image: input.image,
        Cmd: typeof input.cmd === 'string' ? input.cmd.split(' ') : input.cmd,
        Env: input.env,
        ExposedPorts: exposedPorts,
        HostConfig: {
          PortBindings: portBindings,
        },
      });
      return { id: container.id };
    } catch (error: any) {
      logger.error({ err: error }, 'Container creation failed');
      throw new AppError(error.message || 'Failed to create container', error.statusCode || 500);
    }
  }

  public async startContainer(id: string): Promise<void> {
    logger.info({ id }, 'Starting Docker container');
    const client = this.getClient();
    try {
      const container = client.getContainer(id);
      await container.start();
    } catch (error: any) {
      if (error.statusCode === 304) return; // already started
      if (error.statusCode === 404) throw new NotFoundError(`Container ${id} not found`);
      logger.error({ err: error, id }, 'Failed to start container');
      throw new AppError(error.message || 'Failed to start container', error.statusCode || 500);
    }
  }

  public async stopContainer(id: string): Promise<void> {
    logger.info({ id }, 'Stopping Docker container');
    const client = this.getClient();
    try {
      const container = client.getContainer(id);
      await container.stop();
    } catch (error: any) {
      if (error.statusCode === 304) return; // already stopped
      if (error.statusCode === 404) throw new NotFoundError(`Container ${id} not found`);
      logger.error({ err: error, id }, 'Failed to stop container');
      throw new AppError(error.message || 'Failed to stop container', error.statusCode || 500);
    }
  }

  public async restartContainer(id: string): Promise<void> {
    logger.info({ id }, 'Restarting Docker container');
    const client = this.getClient();
    try {
      const container = client.getContainer(id);
      await container.restart();
    } catch (error: any) {
      if (error.statusCode === 404) throw new NotFoundError(`Container ${id} not found`);
      logger.error({ err: error, id }, 'Failed to restart container');
      throw new AppError(error.message || 'Failed to restart container', error.statusCode || 500);
    }
  }

  public async pauseContainer(id: string): Promise<void> {
    logger.info({ id }, 'Pausing Docker container');
    const client = this.getClient();
    try {
      const container = client.getContainer(id);
      await container.pause();
    } catch (error: any) {
      if (error.statusCode === 404) throw new NotFoundError(`Container ${id} not found`);
      logger.error({ err: error, id }, 'Failed to pause container');
      throw new AppError(error.message || 'Failed to pause container', error.statusCode || 500);
    }
  }

  public async unpauseContainer(id: string): Promise<void> {
    logger.info({ id }, 'Unpausing Docker container');
    const client = this.getClient();
    try {
      const container = client.getContainer(id);
      await container.unpause();
    } catch (error: any) {
      if (error.statusCode === 404) throw new NotFoundError(`Container ${id} not found`);
      logger.error({ err: error, id }, 'Failed to unpause container');
      throw new AppError(error.message || 'Failed to unpause container', error.statusCode || 500);
    }
  }

  public async killContainer(id: string): Promise<void> {
    logger.info({ id }, 'Killing Docker container');
    const client = this.getClient();
    try {
      const container = client.getContainer(id);
      await container.kill();
    } catch (error: any) {
      if (error.statusCode === 404) throw new NotFoundError(`Container ${id} not found`);
      logger.error({ err: error, id }, 'Failed to kill container');
      throw new AppError(error.message || 'Failed to kill container', error.statusCode || 500);
    }
  }

  public async removeContainer(id: string, force: boolean = false): Promise<void> {
    logger.info({ id, force }, 'Removing Docker container');
    const client = this.getClient();
    try {
      const container = client.getContainer(id);
      await container.remove({ force, v: true });
    } catch (error: any) {
      if (error.statusCode === 404) throw new NotFoundError(`Container ${id} not found`);
      logger.error({ err: error, id }, 'Failed to remove container');
      throw new AppError(error.message || 'Failed to remove container', error.statusCode || 500);
    }
  }

  public async renameContainer(id: string, newName: string): Promise<void> {
    logger.info({ id, newName }, 'Renaming Docker container');
    const client = this.getClient();
    try {
      const container = client.getContainer(id);
      await container.rename({ name: newName });
    } catch (error: any) {
      if (error.statusCode === 404) throw new NotFoundError(`Container ${id} not found`);
      logger.error({ err: error, id }, 'Failed to rename container');
      throw new AppError(error.message || 'Failed to rename container', error.statusCode || 500);
    }
  }

  public async getContainerLogs(id: string, tail: number = 100, timestamps: boolean = true): Promise<string[]> {
    logger.debug({ id, tail }, 'Reading container log buffer');
    const client = this.getClient();
    try {
      const container = client.getContainer(id);
      const logBuffer = (await container.logs({
        stdout: true,
        stderr: true,
        tail,
        timestamps,
        follow: false,
      })) as Buffer;

      return this.parseDockerLogs(logBuffer);
    } catch (error: any) {
      if (error.statusCode === 404) throw new NotFoundError(`Container ${id} not found`);
      logger.error({ err: error, id }, 'Failed to read container logs');
      throw new AppError('Failed to retrieve logs from Docker Engine', 500);
    }
  }

  private parseDockerLogs(buffer: Buffer): string[] {
    const result: string[] = [];
    let offset = 0;
    while (offset < buffer.length) {
      if (offset + 8 > buffer.length) break;
      const streamType = buffer.readUInt8(offset);
      const size = buffer.readUInt32BE(offset + 4);
      offset += 8;
      if (offset + size > buffer.length) break;
      const content = buffer.toString('utf8', offset, offset + size);
      result.push(content);
      offset += size;
    }
    if (result.length === 0 && buffer.length > 0) {
      return buffer.toString('utf8').split('\n');
    }
    return result.flatMap((r) => r.split('\n')).filter((line) => line.trim().length > 0);
  }
}

export const containerService = new ContainerService();
export default containerService;
