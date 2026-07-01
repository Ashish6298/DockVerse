import dockerService from '../docker/docker.service.js';
import { NotFoundError, AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import type { NetworkListItem, NetworkDetails } from '@dockverse/types';
import { CreateNetworkInput } from '../validators/network.validator.js';

class NetworkService {
  private getClient() {
    const client = dockerService.getClient();
    if (dockerService.getStatus() === 'disconnected') {
      throw new AppError('Docker daemon is disconnected', 503, 'DOCKER_CONNECTION_ERROR');
    }
    return client;
  }

  public async listNetworks(): Promise<NetworkListItem[]> {
    logger.debug('Listing all Docker networks');
    const client = this.getClient();
    try {
      const rawNetworks = await client.listNetworks();
      return rawNetworks.map((net) => ({
        id: net.Id,
        name: net.Name,
        driver: net.Driver || 'unknown',
        scope: net.Scope || 'local',
        attachable: !!net.Attachable,
        internal: !!net.Internal,
        ingress: !!net.Ingress,
        enableIPv6: !!net.EnableIPv6,
        labels: net.Labels || {},
      }));
    } catch (error) {
      logger.error({ err: error }, 'Failed to list Docker networks');
      throw new AppError('Failed to query network list from Docker Engine', 500);
    }
  }

  public async inspectNetwork(id: string): Promise<NetworkDetails> {
    logger.debug({ id }, 'Inspecting network details');
    const client = this.getClient();
    try {
      const networkRef = client.getNetwork(id);
      const data = await networkRef.inspect();

      // Format IPAM configurations
      const subnetConfig = (data.IPAM?.Config || []).map((cfg: any) => ({
        subnet: cfg.Subnet,
        gateway: cfg.Gateway,
      }));

      // Format connected containers metadata
      const containers: NetworkDetails['containers'] = {};
      if (data.Containers) {
        for (const [cId, val] of Object.entries(data.Containers) as [string, any][]) {
          containers[cId] = {
            name: val.Name || cId.slice(0, 12),
            endpointId: val.EndpointID,
            macAddress: val.MacAddress || '',
            ipv4Address: val.IPv4Address || '',
            ipv6Address: val.IPv6Address || '',
          };
        }
      }

      return {
        id: data.Id,
        name: data.Name,
        driver: data.Driver || 'unknown',
        scope: data.Scope || 'local',
        attachable: !!data.Attachable,
        internal: !!data.Internal,
        ingress: !!data.Ingress,
        enableIPv6: !!data.EnableIPv6,
        ipam: {
          driver: data.IPAM?.Driver || 'default',
          config: subnetConfig,
        },
        containers,
        labels: data.Labels || {},
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new NotFoundError(`Docker network ${id} not found`);
      }
      logger.error({ err: error, id }, 'Network inspection failed');
      throw new AppError('Failed to inspect network settings', 500);
    }
  }

  public async createNetwork(input: CreateNetworkInput): Promise<{ id: string }> {
    logger.info({ name: input.name, driver: input.driver }, 'Creating new Docker network');
    const client = this.getClient();

    const ipamConfig: any[] = [];
    if (input.subnet) {
      ipamConfig.push({
        Subnet: input.subnet,
        Gateway: input.gateway,
      });
    }

    const options: any = {
      Name: input.name,
      Driver: input.driver || 'bridge',
      Attachable: !!input.attachable,
      Internal: !!input.internal,
      EnableIPv6: !!input.enableIPv6,
    };

    if (ipamConfig.length > 0) {
      options.IPAM = {
        Driver: 'default',
        Config: ipamConfig,
      };
    }

    try {
      const result = await client.createNetwork(options);
      return { id: result.id };
    } catch (error: any) {
      logger.error({ err: error }, 'Network creation failed');
      throw new AppError(error.message || 'Failed to create network', error.statusCode || 500);
    }
  }

  public async deleteNetwork(id: string): Promise<void> {
    logger.info({ id }, 'Deleting Docker network');
    const client = this.getClient();
    try {
      const network = client.getNetwork(id);
      await network.remove();
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new NotFoundError(`Docker network ${id} not found`);
      }
      if (error.statusCode === 409) {
        throw new AppError('Conflict: Network is currently in use by active containers. Disconnect containers first.', 409, 'NETWORK_IN_USE');
      }
      logger.error({ err: error, id }, 'Failed to delete network');
      throw new AppError(error.message || 'Failed to delete network', error.statusCode || 500);
    }
  }

  public async connectContainer(networkId: string, containerId: string): Promise<void> {
    logger.info({ networkId, containerId }, 'Connecting container to network');
    const client = this.getClient();
    try {
      const network = client.getNetwork(networkId);
      await network.connect({ Container: containerId });
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new NotFoundError(`Network or Container not found`);
      }
      logger.error({ err: error, networkId, containerId }, 'Failed to connect container');
      throw new AppError(error.message || 'Failed to connect container to network', error.statusCode || 500);
    }
  }

  public async disconnectContainer(networkId: string, containerId: string, force: boolean = false): Promise<void> {
    logger.info({ networkId, containerId, force }, 'Disconnecting container from network');
    const client = this.getClient();
    try {
      const network = client.getNetwork(networkId);
      await network.disconnect({ Container: containerId, Force: !!force });
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new NotFoundError(`Network or Container not found`);
      }
      logger.error({ err: error, networkId, containerId }, 'Failed to disconnect container');
      throw new AppError(error.message || 'Failed to disconnect container from network', error.statusCode || 500);
    }
  }

  public async pruneNetworks(): Promise<{ spaceReclaimed: number }> {
    logger.info('Pruning unused Docker networks');
    const client = this.getClient();
    try {
      const result = await client.pruneNetworks();
      return {
        spaceReclaimed: (result.NetworksDeleted || []).length, // Returns count of deleted networks
      };
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to prune networks');
      throw new AppError('Failed to prune unused networks', 500);
    }
  }
}

export const networkService = new NetworkService();
export default networkService;
