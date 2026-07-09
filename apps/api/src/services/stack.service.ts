import yaml from 'yaml';
import dockerService from '../docker/docker.service.js';
import { AppError, NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import type {
  StackInfo,
  StackServiceInfo,
  StackNetworkInfo,
  StackVolumeInfo,
  StackInspectResponse,
  StackOperationStatus,
  StackDeploymentRequest,
  StackScaleRequest,
  StackDashboardSummary
} from '@dockverse/types';

// In-memory stack operations status cache
const stackOperations: Record<string, StackOperationStatus> = {};

// In-memory stack Compose YAML source cache
const stackComposeSources: Record<string, string> = {};

class StackService {
  private getClient(): any {
    const client = dockerService.getClient();
    if (dockerService.getStatus() === 'disconnected') {
      throw new AppError('Docker daemon is disconnected', 503, 'DOCKER_CONNECTION_ERROR');
    }
    return client;
  }

  private async ensureSwarmActive(): Promise<void> {
    try {
      await this.getClient().swarmInspect();
    } catch {
      throw new AppError('Docker Swarm is not active. Stack operations require Swarm mode.', 400, 'SWARM_INACTIVE');
    }
  }

  // --- STACK LIFECYCLE MANAGEMENT ---

  public async listStacks(): Promise<StackInfo[]> {
    await this.ensureSwarmActive();
    const client = this.getClient();

    try {
      const services = await client.listServices();
      const tasks = await client.listTasks();

      // Group services by stack namespace label
      const stacksMap: Record<string, {
        servicesCount: number;
        tasksCount: number;
        createdAt: string;
        updatedAt: string;
        desiredReplicas: number;
        runningReplicas: number;
      }> = {};

      services.forEach((s: any) => {
        const stackName = s.Spec?.Labels?.['com.docker.stack.namespace'];
        if (!stackName) return;

        const desired = s.Spec?.Mode?.Replicated?.Replicas ?? 1;
        const running = tasks.filter((t: any) => t.ServiceID === s.ID && t.Status?.State === 'running').length;

        if (!stacksMap[stackName]) {
          stacksMap[stackName] = {
            servicesCount: 0,
            tasksCount: 0,
            createdAt: s.CreatedAt,
            updatedAt: s.UpdatedAt,
            desiredReplicas: 0,
            runningReplicas: 0,
          };
        }

        const stack = stacksMap[stackName];
        stack.servicesCount++;
        stack.desiredReplicas += desired;
        stack.runningReplicas += running;
        stack.tasksCount += running;

        if (new Date(s.CreatedAt) < new Date(stack.createdAt)) {
          stack.createdAt = s.CreatedAt;
        }
        if (new Date(s.UpdatedAt) > new Date(stack.updatedAt)) {
          stack.updatedAt = s.UpdatedAt;
        }
      });

      return Object.entries(stacksMap).map(([name, data]) => {
        let status: StackInfo['status'] = 'running';
        if (data.servicesCount === 0) {
          status = 'empty';
        } else if (data.runningReplicas === 0 && data.desiredReplicas > 0) {
          status = 'failed';
        } else if (data.runningReplicas < data.desiredReplicas) {
          status = 'degraded';
        }

        return {
          name,
          servicesCount: data.servicesCount,
          tasksCount: data.tasksCount,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          status,
        };
      });
    } catch (err: any) {
      logger.error({ err }, 'Failed to list stacks');
      throw new AppError(err.message || 'Failed to list stacks', 500, 'DOCKER_STACK_ERROR');
    }
  }

  public async inspectStack(name: string): Promise<StackInspectResponse> {
    await this.ensureSwarmActive();
    const client = this.getClient();

    try {
      const services = await client.listServices({
        filters: JSON.stringify({ label: [`com.docker.stack.namespace=${name}`] }),
      });
      const networks = await client.listNetworks({
        filters: JSON.stringify({ label: [`com.docker.stack.namespace=${name}`] }),
      });
      const volumes = await client.listVolumes({
        filters: JSON.stringify({ label: [`com.docker.stack.namespace=${name}`] }),
      });
      const secrets = await client.listSecrets({
        filters: JSON.stringify({ label: [`com.docker.stack.namespace=${name}`] }),
      });
      const configs = await client.listConfigs({
        filters: JSON.stringify({ label: [`com.docker.stack.namespace=${name}`] }),
      });
      const tasks = await client.listTasks();

      const mappedServices: StackServiceInfo[] = services.map((s: any) => {
        const running = tasks.filter((t: any) => t.ServiceID === s.ID && t.Status?.State === 'running').length;
        const desired = s.Spec?.Mode?.Replicated?.Replicas ?? 1;
        const ports = s.Endpoint?.Ports?.map((p: any) => `${p.PublishedPort}:${p.TargetPort}/${p.Protocol}`) || [];

        return {
          id: s.ID,
          name: s.Spec.Name,
          image: s.Spec.TaskTemplate?.ContainerSpec?.Image || '',
          replicas: {
            running,
            desired,
          },
          ports,
        };
      });

      const mappedNetworks: StackNetworkInfo[] = networks.map((n: any) => ({
        id: n.ID,
        name: n.Name,
        driver: n.Driver,
        scope: n.Scope,
      }));

      const mappedVolumes: StackVolumeInfo[] = (volumes.Volumes || []).map((v: any) => ({
        name: v.Name,
        driver: v.Driver,
        scope: v.Scope || 'local',
      }));

      const composeSource = stackComposeSources[name] || 'Compose source code was not cached';

      return {
        name,
        composeSource,
        services: mappedServices,
        networks: mappedNetworks,
        volumes: mappedVolumes,
        secrets: secrets.map((s: any) => s.Spec.Name),
        configs: configs.map((c: any) => c.Spec.Name),
        status: mappedServices.some((s) => s.replicas.running < s.replicas.desired) ? 'degraded' : 'running',
      };
    } catch (err: any) {
      logger.error({ err, name }, 'Failed to inspect stack');
      throw new AppError(err.message || 'Failed to inspect stack', 500, 'DOCKER_STACK_ERROR');
    }
  }

  public deployStackAsync(req: StackDeploymentRequest): string {
    const client = this.getClient();
    const operationId = `deploy_stack_${Date.now()}`;

    stackOperations[operationId] = {
      operationId,
      action: `Deploy Stack ${req.name}`,
      status: 'running',
      progress: 10,
      logs: [`Parsing Compose YAML content for stack: ${req.name}...`],
      timestamp: new Date().toISOString(),
    };

    // Cache YAML Compose source in memory
    stackComposeSources[req.name] = req.content;

    this.ensureSwarmActive()
      .then(async () => {
        const parsed = yaml.parse(req.content);
        if (!parsed || typeof parsed !== 'object' || !parsed.services) {
          throw new AppError('Invalid Compose file syntax: services key is missing.', 400, 'INVALID_COMPOSE');
        }

        const composeServices = parsed.services;
        const composeNetworks = parsed.networks || {};
        const composeVolumes = parsed.volumes || {};

        stackOperations[operationId].logs.push('Creating overlay networks specified in Compose file...');
        stackOperations[operationId].progress = 30;

        // 1. Create Overlay Networks
        for (const [netName, netSpec] of Object.entries(composeNetworks)) {
          const spec: any = netSpec || {};
          const fullNetName = `${req.name}_${netName}`;
          
          // Check duplicate network
          const nets = await client.listNetworks();
          const exist = nets.some((n: any) => n.Name === fullNetName);
          if (!exist) {
            await client.createNetwork({
              Name: fullNetName,
              Driver: spec.driver || 'overlay',
              Attachable: spec.attachable ?? true,
              Labels: {
                'com.docker.stack.namespace': req.name,
              },
            });
            stackOperations[operationId].logs.push(`Overlay network ${fullNetName} created.`);
          }
        }

        stackOperations[operationId].logs.push('Deploying stack services...');
        stackOperations[operationId].progress = 60;

        // 2. Deploy Services
        for (const [svcName, svcSpec] of Object.entries(composeServices)) {
          const spec: any = svcSpec || {};
          const fullSvcName = `${req.name}_${svcName}`;

          const opt: any = {
            Name: fullSvcName,
            Labels: {
              'com.docker.stack.namespace': req.name,
            },
            TaskTemplate: {
              ContainerSpec: {
                Image: spec.image,
                Env: spec.environment ? Object.entries(spec.environment).map(([k, v]) => `${k}=${v}`) : undefined,
              },
              RestartPolicy: spec.restart_policy ? {
                Condition: spec.restart_policy.condition,
                Delay: spec.restart_policy.delay ? spec.restart_policy.delay * 1e9 : undefined,
                MaxAttempts: spec.restart_policy.max_attempts,
              } : undefined,
            },
            Mode: {
              Replicated: {
                Replicas: spec.deploy?.replicas ?? 1,
              },
            },
          };

          // Network attachment mapping
          if (spec.networks) {
            const netsList = Array.isArray(spec.networks) ? spec.networks : Object.keys(spec.networks);
            opt.TaskTemplate.Networks = netsList.map((netName: string) => ({
              Target: `${req.name}_${netName}`,
            }));
          }

          // Port mapping
          if (spec.ports) {
            opt.EndpointSpec = {
              Ports: spec.ports.map((pStr: string) => {
                const parts = pStr.split(':');
                const published = parseInt(parts[0]);
                const target = parseInt(parts[1]);
                return {
                  Protocol: 'tcp',
                  PublishedPort: published,
                  TargetPort: target,
                };
              }),
            };
          }

          // Check if service already exists
          const servicesList = await client.listServices();
          const existingSvc = servicesList.find((s: any) => s.Spec?.Name === fullSvcName);

          if (existingSvc) {
            stackOperations[operationId].logs.push(`Service ${fullSvcName} already exists, updating specification...`);
            const serviceHandler = client.getService(existingSvc.ID);
            await serviceHandler.update({
              version: existingSvc.Version.Index,
              ...opt,
            });
          } else {
            await client.createService(opt);
            stackOperations[operationId].logs.push(`Service ${fullSvcName} created successfully.`);
          }
        }

        stackOperations[operationId].status = 'success';
        stackOperations[operationId].progress = 100;
        stackOperations[operationId].logs.push(`Stack ${req.name} deployed successfully.`);
      })
      .catch((err: any) => {
        logger.error({ err, name: req.name }, 'Stack deployment failed');
        stackOperations[operationId].status = 'failed';
        stackOperations[operationId].progress = 100;
        stackOperations[operationId].error = err.message || 'Stack deployment failed';
        stackOperations[operationId].logs.push(`Deployment failed: ${err.message || 'Stack deployment failed'}`);
      });

    return operationId;
  }

  public scaleStackServiceAsync(req: StackScaleRequest): string {
    const client = this.getClient();
    const operationId = `scale_service_${Date.now()}`;

    stackOperations[operationId] = {
      operationId,
      action: `Scale Service ID ${req.serviceId}`,
      status: 'running',
      progress: 30,
      logs: [`Fetching spec parameters for service ID: ${req.serviceId}`],
      timestamp: new Date().toISOString(),
    };

    this.ensureSwarmActive()
      .then(async () => {
        const serviceHandler = client.getService(req.serviceId);
        const s = await serviceHandler.inspect();

        const spec = s.Spec;
        const version = s.Version?.Index || 0;

        stackOperations[operationId].logs.push(`Current replica count: ${spec.Mode?.Replicated?.Replicas ?? 1}. Updating target replicas to: ${req.replicas}`);
        
        spec.Mode = spec.Mode || {};
        spec.Mode.Replicated = spec.Mode.Replicated || {};
        spec.Mode.Replicated.Replicas = req.replicas;

        await serviceHandler.update({
          version,
          ...spec,
        });

        stackOperations[operationId].status = 'success';
        stackOperations[operationId].progress = 100;
        stackOperations[operationId].logs.push('Scale operation applied successfully.');
      })
      .catch((err: any) => {
        logger.error({ err, id: req.serviceId }, 'Scaling service failed');
        stackOperations[operationId].status = 'failed';
        stackOperations[operationId].progress = 100;
        stackOperations[operationId].error = err.message || 'Scale failed';
        stackOperations[operationId].logs.push(`Scale failed: ${err.message || 'Scale failed'}`);
      });

    return operationId;
  }

  public removeStackAsync(name: string): string {
    const client = this.getClient();
    const operationId = `remove_stack_${Date.now()}`;

    stackOperations[operationId] = {
      operationId,
      action: `Remove Stack ${name}`,
      status: 'running',
      progress: 20,
      logs: [`Listing resources matching stack namespace label: ${name}...`],
      timestamp: new Date().toISOString(),
    };

    this.ensureSwarmActive()
      .then(async () => {
        const services = await client.listServices({
          filters: JSON.stringify({ label: [`com.docker.stack.namespace=${name}`] }),
        });
        const networks = await client.listNetworks({
          filters: JSON.stringify({ label: [`com.docker.stack.namespace=${name}`] }),
        });
        const secrets = await client.listSecrets({
          filters: JSON.stringify({ label: [`com.docker.stack.namespace=${name}`] }),
        });
        const configs = await client.listConfigs({
          filters: JSON.stringify({ label: [`com.docker.stack.namespace=${name}`] }),
        });

        // 1. Delete Services
        for (const s of services) {
          await client.getService(s.ID).remove();
          stackOperations[operationId].logs.push(`Service ${s.Spec.Name} removed.`);
        }

        // 2. Delete Secrets & Configs
        for (const s of secrets) {
          await client.getSecret(s.ID).remove();
          stackOperations[operationId].logs.push(`Secret ${s.Spec.Name} removed.`);
        }
        for (const c of configs) {
          await client.getConfig(c.ID).remove();
          stackOperations[operationId].logs.push(`Config ${c.Spec.Name} removed.`);
        }

        // 3. Delete Networks
        for (const n of networks) {
          await client.getNetwork(n.ID).remove();
          stackOperations[operationId].logs.push(`Overlay network ${n.Name} removed.`);
        }

        // Delete source cache entry
        delete stackComposeSources[name];

        stackOperations[operationId].status = 'success';
        stackOperations[operationId].progress = 100;
        stackOperations[operationId].logs.push(`Stack ${name} removed completely.`);
      })
      .catch((err: any) => {
        logger.error({ err, name }, 'Failed to remove stack');
        stackOperations[operationId].status = 'failed';
        stackOperations[operationId].progress = 100;
        stackOperations[operationId].error = err.message || 'Removal failed';
        stackOperations[operationId].logs.push(`Removal failed: ${err.message || 'Removal failed'}`);
      });

    return operationId;
  }

  // --- GENERAL TELEMETRY & HISTORIES ---

  public async getDashboardSummary(): Promise<StackDashboardSummary> {
    try {
      const active = await this.listStacks();
      const client = this.getClient();
      const services = await client.listServices();
      const tasks = await client.listTasks();

      const totalStacks = active.length;
      const runningStacks = active.filter((s) => s.status === 'running').length;
      const failedStacks = active.filter((s) => s.status === 'failed').length;
      
      const runningTasks = tasks.filter((t: any) => t.Status?.State === 'running').length;
      const pendingTasks = tasks.filter((t: any) => t.Status?.State === 'pending').length;

      return {
        totalStacks,
        runningStacks,
        failedStacks,
        totalServices: services.length,
        runningTasks,
        pendingTasks,
        swarmActive: true,
      };
    } catch {
      return {
        totalStacks: 0,
        runningStacks: 0,
        failedStacks: 0,
        totalServices: 0,
        runningTasks: 0,
        pendingTasks: 0,
        swarmActive: false,
      };
    }
  }

  public getOperation(operationId: string): StackOperationStatus {
    const op = stackOperations[operationId];
    if (!op) {
      throw new NotFoundError(`Stack operation ${operationId} not found`);
    }
    return op;
  }

  public getOperationsHistory(): StackOperationStatus[] {
    return Object.values(stackOperations).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}

export const stackService = new StackService();
export default stackService;
