import dockerService from '../docker/docker.service.js';
import { AppError, NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import type {
  SwarmClusterInfo,
  SwarmNodeInfo,
  SwarmJoinRequest,
  SwarmInitRequest,
  SwarmLeaveRequest,
  SwarmTokenInfo,
  SwarmOperationStatus,
  SwarmServiceInfo,
  SwarmTaskInfo,
  SwarmClusterHealth,
  SwarmSpecUpdateRequest,
  SwarmUnlockKeyInfo
} from '@dockverse/types';

// In-memory operation history
const swarmOperations: Record<string, SwarmOperationStatus> = {};

// Rolling cluster health history
const healthHistory: SwarmClusterHealth[] = [];
const MAX_HEALTH_HISTORY = 30;

class SwarmService {
  private getClient(): any {
    const client = dockerService.getClient();
    if (dockerService.getStatus() === 'disconnected') {
      throw new AppError('Docker daemon is disconnected', 503, 'DOCKER_CONNECTION_ERROR');
    }
    return client;
  }

  // Returns swarm info or throws if not part of a swarm/inactive
  public async inspectSwarm(): Promise<SwarmClusterInfo> {
    const client = this.getClient();
    try {
      const data = await client.swarmInspect();
      return {
        id: data.ID,
        createdAt: data.CreatedAt,
        updatedAt: data.UpdatedAt,
        spec: {
          name: data.Spec?.Name || 'default',
          labels: data.Spec?.Labels || {},
          orchestration: {
            taskHistoryRetentionLimit: data.Spec?.Orchestration?.TaskHistoryRetentionLimit ?? 5,
          },
          raft: {
            snapshotInterval: data.Spec?.Raft?.SnapshotInterval ?? 10000,
            keepOldSnapshots: data.Spec?.Raft?.KeepOldSnapshots ?? 0,
            logEntriesForSlowFollowers: data.Spec?.Raft?.LogEntriesForSlowFollowers ?? 500,
            electionTick: data.Spec?.Raft?.ElectionTick ?? 3,
            heartbeatTick: data.Spec?.Raft?.HeartbeatTick ?? 1,
          },
          caConfig: {
            nodeCertExpiry: data.Spec?.CAConfig?.NodeCertExpiry ?? 7776000000000000,
            externalCAs: data.Spec?.CAConfig?.ExternalCAs?.map((ca: any) => ({
              protocol: ca.Protocol,
              uRL: ca.URL,
              options: ca.Options,
            })),
          },
          encryptionConfig: {
            autoLockManagers: data.Spec?.EncryptionConfig?.AutoLockManagers ?? false,
          },
          dispatcher: {
            heartbeatPeriod: data.Spec?.Dispatcher?.HeartbeatPeriod ?? 5000000000,
          },
        },
        version: {
          index: data.Version?.Index || 0,
        },
      };
    } catch (error: any) {
      // 406 or 503 means Swarm is inactive/not initialized
      if (error.statusCode === 406 || error.statusCode === 503 || error.message?.includes('not a swarm manager')) {
        throw new AppError('This node is not part of a Docker Swarm cluster', 400, 'SWARM_INACTIVE');
      }
      logger.error({ error }, 'Failed to inspect Swarm cluster');
      throw new AppError(error.message || 'Failed to inspect Swarm cluster', error.statusCode || 500, 'SWARM_ERROR');
    }
  }

  // Get status details: active or inactive
  public async getSwarmStatus(): Promise<{ active: boolean; info: SwarmClusterInfo | null }> {
    try {
      const info = await this.inspectSwarm();
      return { active: true, info };
    } catch (err: any) {
      if (err.code === 'SWARM_INACTIVE') {
        return { active: false, info: null };
      }
      throw err;
    }
  }

  // Async Swarm Init
  public initSwarmAsync(req: SwarmInitRequest): string {
    const client = this.getClient();
    const operationId = `init_${Date.now()}`;

    swarmOperations[operationId] = {
      operationId,
      action: 'Swarm Initialization',
      status: 'running',
      progress: 10,
      logs: ['Initiating Swarm cluster creation...'],
      timestamp: new Date().toISOString(),
    };

    const opt: any = {
      ListenAddr: req.listenAddr || '0.0.0.0:2377',
      AdvertiseAddr: req.advertiseAddr,
      DataPathAddr: req.dataPathAddr,
      ForceNewCluster: req.forceNewCluster || false,
    };

    if (req.spec) {
      opt.Spec = {
        Orchestration: req.spec.orchestration ? {
          TaskHistoryRetentionLimit: req.spec.orchestration.taskHistoryRetentionLimit,
        } : undefined,
        Raft: req.spec.raft ? {
          SnapshotInterval: req.spec.raft.snapshotInterval,
          KeepOldSnapshots: req.spec.raft.keepOldSnapshots,
          LogEntriesForSlowFollowers: req.spec.raft.logEntriesForSlowFollowers,
          ElectionTick: req.spec.raft.electionTick,
          HeartbeatTick: req.spec.raft.heartbeatTick,
        } : undefined,
        CAConfig: req.spec.caConfig ? {
          NodeCertExpiry: req.spec.caConfig.nodeCertExpiry,
          ExternalCAs: req.spec.caConfig.externalCAs?.map((ca) => ({
            Protocol: ca.protocol,
            URL: ca.uRL,
            Options: ca.options,
          })),
        } : undefined,
        EncryptionConfig: req.spec.encryptionConfig ? {
          AutoLockManagers: req.spec.encryptionConfig.autoLockManagers,
        } : undefined,
        Dispatcher: req.spec.dispatcher ? {
          HeartbeatPeriod: req.spec.dispatcher.heartbeatPeriod,
        } : undefined,
      };
    }

    swarmOperations[operationId].logs.push(`Payload parameters parsed: ${JSON.stringify(opt)}`);

    client.initSwarm(opt)
      .then((result: any) => {
        swarmOperations[operationId].status = 'success';
        swarmOperations[operationId].progress = 100;
        swarmOperations[operationId].logs.push(`Swarm initialized successfully. ID: ${result}`);
      })
      .catch((err: any) => {
        logger.error({ err }, 'Swarm initialization failed');
        swarmOperations[operationId].status = 'failed';
        swarmOperations[operationId].progress = 100;
        swarmOperations[operationId].error = err.message || 'Swarm init failed';
        swarmOperations[operationId].logs.push(`Failed: ${err.message || 'Swarm init failed'}`);
      });

    return operationId;
  }

  // Async Swarm Join
  public joinSwarmAsync(req: SwarmJoinRequest): string {
    const client = this.getClient();
    const operationId = `join_${Date.now()}`;

    swarmOperations[operationId] = {
      operationId,
      action: 'Swarm Cluster Join',
      status: 'running',
      progress: 20,
      logs: ['Initiating request to join swarm cluster...'],
      timestamp: new Date().toISOString(),
    };

    const opt = {
      ListenAddr: req.listenAddr || '0.0.0.0:2377',
      AdvertiseAddr: req.advertiseAddr,
      DataPathAddr: req.dataPathAddr,
      RemoteAddrs: req.remoteAddrs,
      JoinToken: req.joinToken,
    };

    swarmOperations[operationId].logs.push(`Attempting connection to remote managers: ${req.remoteAddrs.join(', ')}`);

    client.joinSwarm(opt)
      .then(() => {
        swarmOperations[operationId].status = 'success';
        swarmOperations[operationId].progress = 100;
        swarmOperations[operationId].logs.push('Successfully joined Swarm cluster.');
      })
      .catch((err: any) => {
        logger.error({ err }, 'Swarm join failed');
        swarmOperations[operationId].status = 'failed';
        swarmOperations[operationId].progress = 100;
        swarmOperations[operationId].error = err.message || 'Failed to join swarm';
        swarmOperations[operationId].logs.push(`Failed: ${err.message || 'Failed to join swarm'}`);
      });

    return operationId;
  }

  // Async Swarm Leave
  public leaveSwarmAsync(req: SwarmLeaveRequest): string {
    const client = this.getClient();
    const operationId = `leave_${Date.now()}`;

    swarmOperations[operationId] = {
      operationId,
      action: 'Leave Swarm Cluster',
      status: 'running',
      progress: 30,
      logs: [`Preparing to leave swarm. Force flag: ${!!req.force}`],
      timestamp: new Date().toISOString(),
    };

    client.leaveSwarm({ force: !!req.force })
      .then(() => {
        swarmOperations[operationId].status = 'success';
        swarmOperations[operationId].progress = 100;
        swarmOperations[operationId].logs.push('Node left Swarm cluster successfully.');
      })
      .catch((err: any) => {
        logger.error({ err }, 'Leave swarm failed');
        swarmOperations[operationId].status = 'failed';
        swarmOperations[operationId].progress = 100;
        swarmOperations[operationId].error = err.message || 'Failed to leave swarm';
        swarmOperations[operationId].logs.push(`Failed: ${err.message || 'Failed to leave swarm'}`);
      });

    return operationId;
  }

  // Retrieve swarm join tokens
  public async getSwarmTokens(): Promise<SwarmTokenInfo> {
    const swarm = await this.inspectSwarm();
    const client = this.getClient();
    try {
      const details = await client.swarmInspect();
      return {
        manager: details.JoinTokens?.Manager || '',
        worker: details.JoinTokens?.Worker || '',
      };
    } catch (err: any) {
      throw new AppError('Failed to fetch Swarm join tokens', 500, 'SWARM_TOKENS_ERROR');
    }
  }

  // Rotate Swarm Tokens
  public rotateSwarmTokensAsync(role: 'manager' | 'worker'): string {
    const client = this.getClient();
    const operationId = `rotate_${Date.now()}`;

    swarmOperations[operationId] = {
      operationId,
      action: `Rotate ${role} join token`,
      status: 'running',
      progress: 25,
      logs: [`Requesting join token rotation for role: ${role}`],
      timestamp: new Date().toISOString(),
    };

    // Need current spec version to update
    client.swarmInspect()
      .then((data: any) => {
        const spec = data.Spec;
        const version = data.Version?.Index || 0;
        const opt: any = {
          version,
          spec,
        };
        if (role === 'manager') {
          opt.rotateManagerToken = true;
        } else {
          opt.rotateWorkerToken = true;
        }

        swarmOperations[operationId].logs.push(`Updating Swarm specification version ${version} with rotation flag.`);
        return client.swarmUpdate(opt);
      })
      .then(() => {
        swarmOperations[operationId].status = 'success';
        swarmOperations[operationId].progress = 100;
        swarmOperations[operationId].logs.push(`Successfully rotated ${role} join token.`);
      })
      .catch((err: any) => {
        logger.error({ err }, 'Failed to rotate swarm tokens');
        swarmOperations[operationId].status = 'failed';
        swarmOperations[operationId].progress = 100;
        swarmOperations[operationId].error = err.message || 'Failed to rotate tokens';
        swarmOperations[operationId].logs.push(`Rotation failed: ${err.message || 'Failed to rotate tokens'}`);
      });

    return operationId;
  }

  // Retrieve Swarm Unlock Key
  public async getSwarmUnlockKey(): Promise<SwarmUnlockKeyInfo> {
    const client = this.getClient();
    try {
      const data = await client.swarmUnlockKey();
      return {
        unlockKey: data.UnlockKey || '',
      };
    } catch (error: any) {
      logger.error({ error }, 'Failed to get Swarm unlock key');
      throw new AppError(error.message || 'Failed to retrieve Swarm unlock key', error.statusCode || 500, 'SWARM_UNLOCK_KEY_ERROR');
    }
  }

  // Async Swarm Spec Update
  public updateSwarmSpecAsync(req: SwarmSpecUpdateRequest): string {
    const client = this.getClient();
    const operationId = `update_${Date.now()}`;

    swarmOperations[operationId] = {
      operationId,
      action: 'Update Swarm Specification',
      status: 'running',
      progress: 20,
      logs: [`Initiating Swarm specification update at version index ${req.version}`],
      timestamp: new Date().toISOString(),
    };

    const opt: any = {
      version: req.version,
      spec: {
        Orchestration: req.spec?.orchestration ? {
          TaskHistoryRetentionLimit: req.spec.orchestration.taskHistoryRetentionLimit,
        } : undefined,
        Raft: req.spec?.raft ? {
          SnapshotInterval: req.spec.raft.snapshotInterval,
          KeepOldSnapshots: req.spec.raft.keepOldSnapshots,
          LogEntriesForSlowFollowers: req.spec.raft.logEntriesForSlowFollowers,
          ElectionTick: req.spec.raft.electionTick,
          HeartbeatTick: req.spec.raft.heartbeatTick,
        } : undefined,
        CAConfig: req.spec?.caConfig ? {
          NodeCertExpiry: req.spec.caConfig.nodeCertExpiry,
          ExternalCAs: req.spec.caConfig.externalCAs?.map((ca) => ({
            Protocol: ca.protocol,
            URL: ca.uRL,
            Options: ca.options,
          })),
        } : undefined,
        EncryptionConfig: req.spec?.encryptionConfig ? {
          AutoLockManagers: req.spec.encryptionConfig.autoLockManagers,
        } : undefined,
        Dispatcher: req.spec?.dispatcher ? {
          HeartbeatPeriod: req.spec.dispatcher.heartbeatPeriod,
        } : undefined,
      },
    };

    client.swarmUpdate(opt)
      .then(() => {
        swarmOperations[operationId].status = 'success';
        swarmOperations[operationId].progress = 100;
        swarmOperations[operationId].logs.push('Swarm cluster specifications updated successfully.');
      })
      .catch((err: any) => {
        logger.error({ err }, 'Failed to update swarm specs');
        swarmOperations[operationId].status = 'failed';
        swarmOperations[operationId].progress = 100;
        swarmOperations[operationId].error = err.message || 'Update failed';
        swarmOperations[operationId].logs.push(`Failed: ${err.message || 'Update failed'}`);
      });

    return operationId;
  }

  // --- Node Management ---

  public async listNodes(): Promise<SwarmNodeInfo[]> {
    const client = this.getClient();
    try {
      const nodes = await client.listNodes();
      return nodes.map((node: any) => ({
        id: node.ID,
        version: {
          index: node.Version?.Index || 0,
        },
        createdAt: node.CreatedAt,
        updatedAt: node.UpdatedAt,
        spec: {
          name: node.Spec?.Name,
          labels: node.Spec?.Labels || {},
          role: node.Spec?.Role || 'worker',
          availability: node.Spec?.Availability || 'active',
        },
        description: {
          hostname: node.Description?.Hostname || 'unknown',
          platform: {
            architecture: node.Description?.Platform?.Architecture || 'unknown',
            os: node.Description?.Platform?.OS || 'unknown',
          },
          resources: {
            nanoCPUs: node.Description?.Resources?.NanoCPUs || 0,
            memoryBytes: node.Description?.Resources?.MemoryBytes || 0,
          },
          engine: {
            engineVersion: node.Description?.Engine?.EngineVersion || 'unknown',
            labels: node.Description?.Engine?.Labels || {},
            plugins: node.Description?.Engine?.Plugins?.map((p: any) => ({
              type: p.Type,
              name: p.Name,
            })) || [],
          },
          tlsInfo: node.Description?.TLSInfo ? {
            trustRoot: node.Description.TLSInfo.TrustRoot,
            certIssuerSubject: node.Description.TLSInfo.CertIssuerSubject,
            certIssuerPublicKey: node.Description.TLSInfo.CertIssuerPublicKey,
          } : undefined,
        },
        status: {
          state: node.Status?.State || 'unknown',
          message: node.Status?.Message,
          addr: node.Status?.Addr,
        },
        managerStatus: node.ManagerStatus ? {
          leader: node.ManagerStatus.Leader || false,
          reachability: node.ManagerStatus.Reachability || 'unknown',
          addr: node.ManagerStatus.Addr || '',
        } : undefined,
      }));
    } catch (error: any) {
      logger.error({ error }, 'Failed to list nodes');
      throw new AppError(error.message || 'Failed to list Swarm nodes', error.statusCode || 500, 'SWARM_NODES_ERROR');
    }
  }

  public async inspectNode(id: string): Promise<SwarmNodeInfo> {
    const client = this.getClient();
    try {
      const nodeHandler = client.getNode(id);
      const node = await nodeHandler.inspect();
      return {
        id: node.ID,
        version: {
          index: node.Version?.Index || 0,
        },
        createdAt: node.CreatedAt,
        updatedAt: node.UpdatedAt,
        spec: {
          name: node.Spec?.Name,
          labels: node.Spec?.Labels || {},
          role: node.Spec?.Role || 'worker',
          availability: node.Spec?.Availability || 'active',
        },
        description: {
          hostname: node.Description?.Hostname || 'unknown',
          platform: {
            architecture: node.Description?.Platform?.Architecture || 'unknown',
            os: node.Description?.Platform?.OS || 'unknown',
          },
          resources: {
            nanoCPUs: node.Description?.Resources?.NanoCPUs || 0,
            memoryBytes: node.Description?.Resources?.MemoryBytes || 0,
          },
          engine: {
            engineVersion: node.Description?.Engine?.EngineVersion || 'unknown',
            labels: node.Description?.Engine?.Labels || {},
            plugins: node.Description?.Engine?.Plugins?.map((p: any) => ({
              type: p.Type,
              name: p.Name,
            })) || [],
          },
          tlsInfo: node.Description?.TLSInfo ? {
            trustRoot: node.Description.TLSInfo.TrustRoot,
            certIssuerSubject: node.Description.TLSInfo.CertIssuerSubject,
            certIssuerPublicKey: node.Description.TLSInfo.CertIssuerPublicKey,
          } : undefined,
        },
        status: {
          state: node.Status?.State || 'unknown',
          message: node.Status?.Message,
          addr: node.Status?.Addr,
        },
        managerStatus: node.ManagerStatus ? {
          leader: node.ManagerStatus.Leader || false,
          reachability: node.ManagerStatus.Reachability || 'unknown',
          addr: node.ManagerStatus.Addr || '',
        } : undefined,
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new NotFoundError(`Node ${id} not found`);
      }
      logger.error({ error, id }, 'Failed to inspect node');
      throw new AppError(error.message || 'Failed to inspect node', error.statusCode || 500, 'SWARM_NODE_ERROR');
    }
  }

  // Mutates node attributes asynchronously
  public mutateNodeAsync(id: string, action: 'promote' | 'demote' | 'drain' | 'activate' | 'pause'): string {
    const client = this.getClient();
    const operationId = `${action}_node_${Date.now()}`;

    swarmOperations[operationId] = {
      operationId,
      action: `${action.toUpperCase()} Node ${id}`,
      status: 'running',
      progress: 30,
      logs: [`Initiating ${action} operation on node ID ${id}`],
      timestamp: new Date().toISOString(),
    };

    client.getNode(id).inspect()
      .then((node: any) => {
        const spec = { ...node.Spec };
        const version = node.Version?.Index || 0;

        swarmOperations[operationId].logs.push(`Current state: role=${spec.Role}, availability=${spec.Availability}`);

        if (action === 'promote') {
          spec.Role = 'manager';
        } else if (action === 'demote') {
          spec.Role = 'worker';
        } else if (action === 'drain') {
          spec.Availability = 'drain';
        } else if (action === 'activate') {
          spec.Availability = 'active';
        } else if (action === 'pause') {
          spec.Availability = 'pause';
        }

        swarmOperations[operationId].logs.push(`Applying target specification: role=${spec.Role}, availability=${spec.Availability}`);
        return client.getNode(id).update({ version, spec });
      })
      .then(() => {
        swarmOperations[operationId].status = 'success';
        swarmOperations[operationId].progress = 100;
        swarmOperations[operationId].logs.push(`Node mutation [${action}] completed successfully.`);
      })
      .catch((err: any) => {
        logger.error({ err, id, action }, 'Failed to mutate node');
        swarmOperations[operationId].status = 'failed';
        swarmOperations[operationId].progress = 100;
        swarmOperations[operationId].error = err.message || 'Node update failed';
        swarmOperations[operationId].logs.push(`Mutation failed: ${err.message || 'Node update failed'}`);
      });

    return operationId;
  }

  // Removes node asynchronously
  public removeNodeAsync(id: string, force = false): string {
    const client = this.getClient();
    const operationId = `remove_node_${Date.now()}`;

    swarmOperations[operationId] = {
      operationId,
      action: `Remove Node ${id}`,
      status: 'running',
      progress: 20,
      logs: [`Initiating removal for node ID ${id}. Force flag: ${force}`],
      timestamp: new Date().toISOString(),
    };

    client.getNode(id).remove({ force })
      .then(() => {
        swarmOperations[operationId].status = 'success';
        swarmOperations[operationId].progress = 100;
        swarmOperations[operationId].logs.push(`Node ${id} removed successfully from swarm.`);
      })
      .catch((err: any) => {
        logger.error({ err, id }, 'Failed to remove node');
        swarmOperations[operationId].status = 'failed';
        swarmOperations[operationId].progress = 100;
        swarmOperations[operationId].error = err.message || 'Node removal failed';
        swarmOperations[operationId].logs.push(`Failed: ${err.message || 'Node removal failed'}`);
      });

    return operationId;
  }

  // --- Swarm Service & Task Operations ---

  public async listServices(): Promise<SwarmServiceInfo[]> {
    const client = this.getClient();
    try {
      const services = await client.listServices();
      return services.map((svc: any) => ({
        id: svc.ID,
        version: {
          index: svc.Version?.Index || 0,
        },
        createdAt: svc.CreatedAt,
        updatedAt: svc.UpdatedAt,
        spec: {
          name: svc.Spec?.Name || '',
          labels: svc.Spec?.Labels || {},
          mode: svc.Spec?.Mode ? {
            replicated: svc.Spec.Mode.Replicated ? {
              replicas: svc.Spec.Mode.Replicated.Replicas,
            } : undefined,
            global: svc.Spec.Mode.Global,
          } : { replicated: { replicas: 1 } },
          taskTemplate: {
            containerSpec: {
              image: svc.Spec?.TaskTemplate?.ContainerSpec?.Image || '',
              env: svc.Spec?.TaskTemplate?.ContainerSpec?.Env,
              mounts: svc.Spec?.TaskTemplate?.ContainerSpec?.Mounts?.map((m: any) => ({
                type: m.Type,
                source: m.Source,
                target: m.Target,
                readOnly: m.ReadOnly,
              })),
              secrets: svc.Spec?.TaskTemplate?.ContainerSpec?.Secrets?.map((s: any) => ({
                file: s.File ? {
                  name: s.File.Name,
                  uID: s.File.UID,
                  gID: s.File.GID,
                  mode: s.File.Mode,
                } : undefined,
                secretID: s.SecretID,
                secretName: s.SecretName,
              })),
              configs: svc.Spec?.TaskTemplate?.ContainerSpec?.Configs?.map((c: any) => ({
                file: c.File ? {
                  name: c.File.Name,
                  uID: c.File.UID,
                  gID: c.File.GID,
                  mode: c.File.Mode,
                } : undefined,
                configID: c.ConfigID,
                configName: c.ConfigName,
              })),
            },
            resources: svc.Spec?.TaskTemplate?.Resources ? {
              limits: svc.Spec.TaskTemplate.Resources.Limits ? {
                nanoCPUs: svc.Spec.TaskTemplate.Resources.Limits.NanoCPUs,
                memoryBytes: svc.Spec.TaskTemplate.Resources.Limits.MemoryBytes,
              } : undefined,
              reservations: svc.Spec.TaskTemplate.Resources.Reservations ? {
                nanoCPUs: svc.Spec.TaskTemplate.Resources.Reservations.NanoCPUs,
                memoryBytes: svc.Spec.TaskTemplate.Resources.Reservations.MemoryBytes,
              } : undefined,
            } : undefined,
            restartPolicy: svc.Spec?.TaskTemplate?.RestartPolicy ? {
              condition: svc.Spec.TaskTemplate.RestartPolicy.Condition,
              delay: svc.Spec.TaskTemplate.RestartPolicy.Delay,
              maxAttempts: svc.Spec.TaskTemplate.RestartPolicy.MaxAttempts,
              window: svc.Spec.TaskTemplate.RestartPolicy.Window,
            } : undefined,
            placement: svc.Spec?.TaskTemplate?.Placement ? {
              constraints: svc.Spec.TaskTemplate.Placement.Constraints,
            } : undefined,
            logDriver: svc.Spec?.TaskTemplate?.LogDriver ? {
              name: svc.Spec.TaskTemplate.LogDriver.Name,
              options: svc.Spec.TaskTemplate.LogDriver.Options,
            } : undefined,
          },
          updateConfig: svc.Spec?.UpdateConfig ? {
            parallelism: svc.Spec.UpdateConfig.Parallelism,
            delay: svc.Spec.UpdateConfig.Delay,
            failureAction: svc.Spec.UpdateConfig.FailureAction,
            monitor: svc.Spec.UpdateConfig.Monitor,
            maxFailureRatio: svc.Spec.UpdateConfig.MaxFailureRatio,
            order: svc.Spec.UpdateConfig.Order,
          } : undefined,
          rollbackConfig: svc.Spec?.RollbackConfig ? {
            parallelism: svc.Spec.RollbackConfig.Parallelism,
            delay: svc.Spec.RollbackConfig.Delay,
            failureAction: svc.Spec.RollbackConfig.FailureAction,
            monitor: svc.Spec.RollbackConfig.Monitor,
            maxFailureRatio: svc.Spec.RollbackConfig.MaxFailureRatio,
            order: svc.Spec.RollbackConfig.Order,
          } : undefined,
        },
        endpoint: svc.Endpoint ? {
          spec: svc.Endpoint.Spec ? {
            mode: svc.Endpoint.Spec.Mode,
            ports: svc.Endpoint.Spec.Ports?.map((p: any) => ({
              protocol: p.Protocol,
              targetPort: p.TargetPort,
              publishedPort: p.PublishedPort,
              publishMode: p.PublishMode,
            })),
          } : undefined,
          ports: svc.Endpoint.Ports?.map((p: any) => ({
            protocol: p.Protocol,
            targetPort: p.TargetPort,
            publishedPort: p.PublishedPort,
            publishMode: p.PublishMode,
          })),
          virtualIPs: svc.Endpoint.VirtualIPs?.map((vip: any) => ({
            networkID: vip.NetworkID,
            addr: vip.Addr,
          })),
        } : undefined,
        updateStatus: svc.UpdateStatus ? {
          state: svc.UpdateStatus.State,
          startedAt: svc.UpdateStatus.StartedAt,
          completedAt: svc.UpdateStatus.CompletedAt,
          message: svc.UpdateStatus.Message,
        } : undefined,
      }));
    } catch (error: any) {
      logger.error({ error }, 'Failed to list services');
      throw new AppError(error.message || 'Failed to list Swarm services', error.statusCode || 500, 'SWARM_SERVICES_ERROR');
    }
  }

  public async inspectService(id: string): Promise<SwarmServiceInfo> {
    const client = this.getClient();
    try {
      const svc = await client.getService(id).inspect();
      return {
        id: svc.ID,
        version: {
          index: svc.Version?.Index || 0,
        },
        createdAt: svc.CreatedAt,
        updatedAt: svc.UpdatedAt,
        spec: {
          name: svc.Spec?.Name || '',
          labels: svc.Spec?.Labels || {},
          mode: svc.Spec?.Mode ? {
            replicated: svc.Spec.Mode.Replicated ? {
              replicas: svc.Spec.Mode.Replicated.Replicas,
            } : undefined,
            global: svc.Spec.Mode.Global,
          } : { replicated: { replicas: 1 } },
          taskTemplate: {
            containerSpec: {
              image: svc.Spec?.TaskTemplate?.ContainerSpec?.Image || '',
              env: svc.Spec?.TaskTemplate?.ContainerSpec?.Env,
              mounts: svc.Spec?.TaskTemplate?.ContainerSpec?.Mounts?.map((m: any) => ({
                type: m.Type,
                source: m.Source,
                target: m.Target,
                readOnly: m.ReadOnly,
              })),
              secrets: svc.Spec?.TaskTemplate?.ContainerSpec?.Secrets?.map((s: any) => ({
                file: s.File ? {
                  name: s.File.Name,
                  uID: s.File.UID,
                  gID: s.File.GID,
                  mode: s.File.Mode,
                } : undefined,
                secretID: s.SecretID,
                secretName: s.SecretName,
              })),
              configs: svc.Spec?.TaskTemplate?.ContainerSpec?.Configs?.map((c: any) => ({
                file: c.File ? {
                  name: c.File.Name,
                  uID: c.File.UID,
                  gID: c.File.GID,
                  mode: c.File.Mode,
                } : undefined,
                configID: c.ConfigID,
                configName: c.ConfigName,
              })),
            },
            resources: svc.Spec?.TaskTemplate?.Resources ? {
              limits: svc.Spec.TaskTemplate.Resources.Limits ? {
                nanoCPUs: svc.Spec.TaskTemplate.Resources.Limits.NanoCPUs,
                memoryBytes: svc.Spec.TaskTemplate.Resources.Limits.MemoryBytes,
              } : undefined,
              reservations: svc.Spec.TaskTemplate.Resources.Reservations ? {
                nanoCPUs: svc.Spec.TaskTemplate.Resources.Reservations.NanoCPUs,
                memoryBytes: svc.Spec.TaskTemplate.Resources.Reservations.MemoryBytes,
              } : undefined,
            } : undefined,
            restartPolicy: svc.Spec?.TaskTemplate?.RestartPolicy ? {
              condition: svc.Spec.TaskTemplate.RestartPolicy.Condition,
              delay: svc.Spec.TaskTemplate.RestartPolicy.Delay,
              maxAttempts: svc.Spec.TaskTemplate.RestartPolicy.MaxAttempts,
              window: svc.Spec.TaskTemplate.RestartPolicy.Window,
            } : undefined,
            placement: svc.Spec?.TaskTemplate?.Placement ? {
              constraints: svc.Spec.TaskTemplate.Placement.Constraints,
            } : undefined,
            logDriver: svc.Spec?.TaskTemplate?.LogDriver ? {
              name: svc.Spec.TaskTemplate.LogDriver.Name,
              options: svc.Spec.TaskTemplate.LogDriver.Options,
            } : undefined,
          },
          updateConfig: svc.Spec?.UpdateConfig ? {
            parallelism: svc.Spec.UpdateConfig.Parallelism,
            delay: svc.Spec.UpdateConfig.Delay,
            failureAction: svc.Spec.UpdateConfig.FailureAction,
            monitor: svc.Spec.UpdateConfig.Monitor,
            maxFailureRatio: svc.Spec.UpdateConfig.MaxFailureRatio,
            order: svc.Spec.UpdateConfig.Order,
          } : undefined,
          rollbackConfig: svc.Spec?.RollbackConfig ? {
            parallelism: svc.Spec.RollbackConfig.Parallelism,
            delay: svc.Spec.RollbackConfig.Delay,
            failureAction: svc.Spec.RollbackConfig.FailureAction,
            monitor: svc.Spec.RollbackConfig.Monitor,
            maxFailureRatio: svc.Spec.RollbackConfig.MaxFailureRatio,
            order: svc.Spec.RollbackConfig.Order,
          } : undefined,
        },
        endpoint: svc.Endpoint ? {
          spec: svc.Endpoint.Spec ? {
            mode: svc.Endpoint.Spec.Mode,
            ports: svc.Endpoint.Spec.Ports?.map((p: any) => ({
              protocol: p.Protocol,
              targetPort: p.TargetPort,
              publishedPort: p.PublishedPort,
              publishMode: p.PublishMode,
            })),
          } : undefined,
          ports: svc.Endpoint.Ports?.map((p: any) => ({
            protocol: p.Protocol,
            targetPort: p.TargetPort,
            publishedPort: p.PublishedPort,
            publishMode: p.PublishMode,
          })),
          virtualIPs: svc.Endpoint.VirtualIPs?.map((vip: any) => ({
            networkID: vip.NetworkID,
            addr: vip.Addr,
          })),
        } : undefined,
        updateStatus: svc.UpdateStatus ? {
          state: svc.UpdateStatus.State,
          startedAt: svc.UpdateStatus.StartedAt,
          completedAt: svc.UpdateStatus.CompletedAt,
          message: svc.UpdateStatus.Message,
        } : undefined,
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new NotFoundError(`Swarm Service ${id} not found`);
      }
      logger.error({ error, id }, 'Failed to inspect Swarm service');
      throw new AppError(error.message || 'Failed to inspect service', error.statusCode || 500, 'SWARM_SERVICE_INSPECT_ERROR');
    }
  }

  public async listTasks(serviceId?: string): Promise<SwarmTaskInfo[]> {
    const client = this.getClient();
    const filter: any = {};
    if (serviceId) {
      filter.filters = JSON.stringify({ service: [serviceId] });
    }

    try {
      const tasks = await client.listTasks(filter);
      return tasks.map((task: any) => ({
        id: task.ID,
        version: {
          index: task.Version?.Index || 0,
        },
        createdAt: task.CreatedAt,
        updatedAt: task.UpdatedAt,
        name: task.Name,
        labels: task.Labels || {},
        spec: {
          containerSpec: {
            image: task.Spec?.ContainerSpec?.Image || '',
          },
        },
        serviceID: task.ServiceID,
        slot: task.Slot,
        nodeID: task.NodeID,
        status: {
          timestamp: task.Status?.Timestamp || '',
          state: task.Status?.State || 'new',
          message: task.Status?.Message,
          err: task.Status?.Err,
          containerStatus: task.Status?.ContainerStatus ? {
            containerID: task.Status.ContainerStatus.ContainerID,
            pID: task.Status.ContainerStatus.PID,
            exitCode: task.Status.ContainerStatus.ExitCode,
          } : undefined,
        },
        desiredState: task.DesiredState || '',
      }));
    } catch (error: any) {
      logger.error({ error }, 'Failed to list Swarm tasks');
      throw new AppError(error.message || 'Failed to list Swarm tasks', error.statusCode || 500, 'SWARM_TASKS_ERROR');
    }
  }

  public async inspectTask(id: string): Promise<SwarmTaskInfo> {
    const client = this.getClient();
    try {
      const task = await client.getTask(id).inspect();
      return {
        id: task.ID,
        version: {
          index: task.Version?.Index || 0,
        },
        createdAt: task.CreatedAt,
        updatedAt: task.UpdatedAt,
        name: task.Name,
        labels: task.Labels || {},
        spec: {
          containerSpec: {
            image: task.Spec?.ContainerSpec?.Image || '',
          },
        },
        serviceID: task.ServiceID,
        slot: task.Slot,
        nodeID: task.NodeID,
        status: {
          timestamp: task.Status?.Timestamp || '',
          state: task.Status?.State || 'new',
          message: task.Status?.Message,
          err: task.Status?.Err,
          containerStatus: task.Status?.ContainerStatus ? {
            containerID: task.Status.ContainerStatus.ContainerID,
            pID: task.Status.ContainerStatus.PID,
            exitCode: task.Status.ContainerStatus.ExitCode,
          } : undefined,
        },
        desiredState: task.DesiredState || '',
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new NotFoundError(`Task ${id} not found`);
      }
      logger.error({ error, id }, 'Failed to inspect Swarm task');
      throw new AppError(error.message || 'Failed to inspect task', error.statusCode || 500, 'SWARM_TASK_INSPECT_ERROR');
    }
  }

  // --- Health Aggregation & Snapshots ---

  public async getClusterHealth(): Promise<SwarmClusterHealth> {
    // Collect info
    let nodes: SwarmNodeInfo[] = [];
    let services: SwarmServiceInfo[] = [];
    let tasks: SwarmTaskInfo[] = [];

    try {
      nodes = await this.listNodes();
      services = await this.listServices();
      tasks = await this.listTasks();
    } catch (err: any) {
      // Swarm is inactive
      return {
        status: 'inactive',
        managers: { total: 0, active: 0, unreachable: 0 },
        workers: { total: 0, active: 0, drain: 0, pause: 0 },
        unhealthyNodes: [],
        pendingTasks: 0,
        failedTasks: 0,
        schedulingErrors: 0,
        resourceUtilization: { totalCpu: 0, totalMemoryBytes: 0 },
        timestamp: new Date().toISOString(),
      };
    }

    const managers = { total: 0, active: 0, unreachable: 0 };
    const workers = { total: 0, active: 0, drain: 0, pause: 0 };
    const unhealthyNodes: string[] = [];
    let totalCpu = 0;
    let totalMemoryBytes = 0;

    nodes.forEach((n) => {
      const isManager = n.spec.role === 'manager';
      const isDown = n.status.state === 'down' || n.status.state === 'disconnected';

      // Count resources
      totalCpu += n.description.resources.nanoCPUs / 1e9;
      totalMemoryBytes += n.description.resources.memoryBytes;

      if (isManager) {
        managers.total++;
        if (n.managerStatus?.reachability === 'reachable' || n.managerStatus?.leader) {
          managers.active++;
        } else {
          managers.unreachable++;
          unhealthyNodes.push(n.id);
        }
      } else {
        workers.total++;
        if (n.spec.availability === 'active' && !isDown) {
          workers.active++;
        } else if (n.spec.availability === 'drain') {
          workers.drain++;
        } else if (n.spec.availability === 'pause') {
          workers.pause++;
        }
        if (isDown) {
          unhealthyNodes.push(n.id);
        }
      }
    });

    const pendingTasks = tasks.filter((t) => t.status.state === 'pending' || t.status.state === 'assigned').length;
    const failedTasks = tasks.filter((t) => t.status.state === 'failed' || t.status.state === 'rejected').length;
    const schedulingErrors = tasks.filter((t) => t.status.err || t.status.message?.includes('scheduling')).length;

    // Calculate cluster status
    let status: SwarmClusterHealth['status'] = 'healthy';
    if (unhealthyNodes.length > 0 || managers.unreachable > 0 || failedTasks > 2) {
      status = 'degraded';
    }
    // Quorum loss check: if active managers is <= total managers / 2
    if (managers.total > 0 && managers.active <= Math.floor(managers.total / 2)) {
      status = 'critical';
    }

    const health: SwarmClusterHealth = {
      status,
      managers,
      workers,
      unhealthyNodes,
      pendingTasks,
      failedTasks,
      schedulingErrors,
      resourceUtilization: {
        totalCpu,
        totalMemoryBytes,
      },
      timestamp: new Date().toISOString(),
    };

    // Cache health snapshots in memory with bounded rolling history
    healthHistory.push(health);
    if (healthHistory.length > MAX_HEALTH_HISTORY) {
      healthHistory.shift();
    }

    return health;
  }

  public getHealthHistory(): SwarmClusterHealth[] {
    return healthHistory;
  }

  // --- Operations Management ---

  public getOperation(operationId: string): SwarmOperationStatus {
    const op = swarmOperations[operationId];
    if (!op) {
      throw new NotFoundError(`Swarm operation ${operationId} not found`);
    }
    return op;
  }

  public getOperationsHistory(): SwarmOperationStatus[] {
    return Object.values(swarmOperations).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}

export const swarmService = new SwarmService();
export default swarmService;
