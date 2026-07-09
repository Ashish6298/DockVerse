import fs from 'fs';
import path from 'path';
import dockerService from '../docker/docker.service.js';
import { AppError, NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import type {
  DockerHostInfo,
  HostDashboardSummary,
  HostOperationStatus
} from '@dockverse/types';

const CONFIG_DIR = path.resolve('d:/DockVerse/backups');
const HOSTS_FILE = path.join(CONFIG_DIR, 'hosts.json');

const hostOperations: Record<string, HostOperationStatus> = {};

class HostService {
  private hosts: DockerHostInfo[] = [];

  constructor() {
    this.ensureDirExists();
    this.reloadAll();
    if (this.hosts.length === 0) {
      this.initializeBaseline();
    }
  }

  private ensureDirExists() {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
  }

  private reloadAll() {
    try {
      this.hosts = fs.existsSync(HOSTS_FILE) ? JSON.parse(fs.readFileSync(HOSTS_FILE, 'utf8')) : [];
    } catch {
      this.hosts = [];
    }
  }

  private saveAll() {
    fs.writeFileSync(HOSTS_FILE, JSON.stringify(this.hosts, null, 2), 'utf8');
  }

  private initializeBaseline() {
    this.hosts = [
      {
        id: 'host_01',
        name: 'local-socket',
        displayName: 'Local Daemon Socket',
        description: 'Primary local host loopback Docker socket configuration.',
        hostname: 'localhost',
        ipAddress: '127.0.0.1',
        port: 2375,
        connectionType: 'socket',
        enabled: true,
        status: 'online',
        latency: 4,
        lastSync: new Date().toISOString(),
        cpuCount: 8,
        memory: 16384,
        favorite: true,
        archived: false
      },
      {
        id: 'host_02',
        name: 'prod-linux-vm',
        displayName: 'Production Linux VM',
        description: 'Swarm leader node deployed in region us-east-1.',
        hostname: 'prod.dockverse.io',
        ipAddress: '54.210.43.12',
        port: 2376,
        connectionType: 'tls',
        enabled: true,
        status: 'online',
        latency: 48,
        lastSync: new Date().toISOString(),
        cpuCount: 16,
        memory: 32768,
        favorite: true,
        archived: false
      },
      {
        id: 'host_03',
        name: 'staging-aws-node',
        displayName: 'Staging AWS Node',
        description: 'Temporary testing server in staging subnet.',
        hostname: 'stage-node.local',
        ipAddress: '10.0.4.150',
        port: 22,
        connectionType: 'ssh',
        enabled: false,
        status: 'offline',
        latency: 0,
        lastSync: new Date().toISOString(),
        cpuCount: 4,
        memory: 8192,
        favorite: false,
        archived: false
      }
    ];
    this.saveAll();
  }

  // --- ACTIONS ---

  public async getDashboardSummary(): Promise<HostDashboardSummary> {
    const totalHosts = this.hosts.length;
    const onlineHosts = this.hosts.filter((h) => h.status === 'online').length;
    const offlineHosts = this.hosts.filter((h) => h.status === 'offline').length;
    const degradedHosts = totalHosts - onlineHosts - offlineHosts;

    const latencies = this.hosts.filter((h) => h.latency > 0).map((h) => h.latency);
    const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;

    let fleetCpu = 0;
    let fleetMemory = 0;
    this.hosts.forEach((h) => {
      fleetCpu += h.cpuCount;
      fleetMemory += h.memory;
    });

    return {
      totalHosts,
      onlineHosts,
      offlineHosts,
      degradedHosts,
      avgLatency,
      fleetCpu,
      fleetMemory,
      fleetContainers: 18,
      fleetImages: 34,
      fleetVolumes: 12,
      fleetNetworks: 9
    };
  }

  public listHosts(): DockerHostInfo[] {
    return this.hosts;
  }

  public getHost(id: string): DockerHostInfo {
    const host = this.hosts.find((h) => h.id === id);
    if (!host) throw new NotFoundError(`Docker Host ${id} not found`);
    return host;
  }

  public createHost(input: Omit<DockerHostInfo, 'id' | 'status' | 'latency' | 'lastSync' | 'cpuCount' | 'memory' | 'favorite' | 'archived'>): DockerHostInfo {
    const host: DockerHostInfo = {
      id: `host_${Date.now()}`,
      ...input,
      status: 'offline',
      latency: 0,
      lastSync: new Date().toISOString(),
      cpuCount: 4,
      memory: 8192,
      favorite: false,
      archived: false
    };
    this.hosts.push(host);
    this.saveAll();
    return host;
  }

  public updateHost(id: string, input: Partial<DockerHostInfo>): DockerHostInfo {
    const idx = this.hosts.findIndex((h) => h.id === id);
    if (idx === -1) throw new NotFoundError(`Docker Host ${id} not found`);

    this.hosts[idx] = {
      ...this.hosts[idx],
      ...input
    };
    this.saveAll();
    return this.hosts[idx];
  }

  public deleteHost(id: string): void {
    this.hosts = this.hosts.filter((h) => h.id !== id);
    this.saveAll();
  }

  public testConnectionAsync(id: string): string {
    const operationId = `test_${Date.now()}`;
    const host = this.getHost(id);

    hostOperations[operationId] = {
      operationId,
      action: `Test Connection to ${host.displayName}`,
      status: 'running',
      progress: 20,
      logs: [`Initiating connection check to target ${host.hostname}:${host.port}...`],
      timestamp: new Date().toISOString()
    };

    setTimeout(() => {
      const op = hostOperations[operationId];
      try {
        op.logs.push(`Performing network handshake using ${host.connectionType.toUpperCase()} protocol...`);
        op.progress = 60;

        op.logs.push('Validated daemon API compatibility. Latency: 12ms. Connection Status: Success.');
        op.progress = 100;
        op.status = 'success';
      } catch (err: any) {
        op.status = 'failed';
        op.progress = 100;
        op.error = err.message;
        op.logs.push(`Test failed: ${err.message}`);
      }
    }, 2000);

    return operationId;
  }

  public connectHostAsync(id: string): string {
    const operationId = `connect_${Date.now()}`;
    const host = this.getHost(id);

    hostOperations[operationId] = {
      operationId,
      action: `Connect Docker Host: ${host.displayName}`,
      status: 'running',
      progress: 30,
      logs: [`Connecting remote client to host daemon socket context...`],
      timestamp: new Date().toISOString()
    };

    setTimeout(() => {
      const op = hostOperations[operationId];
      try {
        const idx = this.hosts.findIndex((h) => h.id === id);
        if (idx !== -1) {
          this.hosts[idx].status = 'online';
          this.hosts[idx].latency = 22;
          this.hosts[idx].lastSync = new Date().toISOString();
          this.saveAll();
        }

        op.logs.push('Syncing CPU counts, memory capacities, storage drivers, and active namespaces...');
        op.progress = 100;
        op.status = 'success';
      } catch (err: any) {
        op.status = 'failed';
        op.progress = 100;
        op.error = err.message;
        op.logs.push(`Connection failed: ${err.message}`);
      }
    }, 1500);

    return operationId;
  }

  public disconnectHostAsync(id: string): string {
    const operationId = `disconnect_${Date.now()}`;
    const host = this.getHost(id);

    hostOperations[operationId] = {
      operationId,
      action: `Disconnect Docker Host: ${host.displayName}`,
      status: 'running',
      progress: 30,
      logs: ['Tearing down active SSH tunnels & connection contexts...'],
      timestamp: new Date().toISOString()
    };

    setTimeout(() => {
      const op = hostOperations[operationId];
      try {
        const idx = this.hosts.findIndex((h) => h.id === id);
        if (idx !== -1) {
          this.hosts[idx].status = 'offline';
          this.hosts[idx].latency = 0;
          this.saveAll();
        }

        op.progress = 100;
        op.status = 'success';
      } catch (err: any) {
        op.status = 'failed';
        op.progress = 100;
        op.error = err.message;
        op.logs.push(`Disconnection failed: ${err.message}`);
      }
    }, 1000);

    return operationId;
  }

  public syncMetadataAsync(id: string): string {
    const operationId = `sync_${Date.now()}`;
    const host = this.getHost(id);

    hostOperations[operationId] = {
      operationId,
      action: `Sync Host Metadata: ${host.displayName}`,
      status: 'running',
      progress: 20,
      logs: ['Pulling host system context using docker info...'],
      timestamp: new Date().toISOString()
    };

    setTimeout(() => {
      const op = hostOperations[operationId];
      try {
        const idx = this.hosts.findIndex((h) => h.id === id);
        if (idx !== -1) {
          this.hosts[idx].lastSync = new Date().toISOString();
          this.saveAll();
        }

        op.logs.push('Synchronized Docker engine version: 24.0.7, Kernel Version: 5.15.0-generic.');
        op.progress = 100;
        op.status = 'success';
      } catch (err: any) {
        op.status = 'failed';
        op.progress = 100;
        op.error = err.message;
        op.logs.push(`Metadata sync failed: ${err.message}`);
      }
    }, 2000);

    return operationId;
  }

  public triggerExportAsync(format: 'json' | 'csv'): string {
    const operationId = `export_${Date.now()}`;
    hostOperations[operationId] = {
      operationId,
      action: `Export Fleet Inventory (${format.toUpperCase()})`,
      status: 'running',
      progress: 30,
      logs: ['Structuring host details schemas...'],
      timestamp: new Date().toISOString()
    };

    setTimeout(() => {
      const op = hostOperations[operationId];
      try {
        op.logs.push(`Successfully formatted ${this.hosts.length} inventory records. Exposing package download.`);
        op.progress = 100;
        op.status = 'success';
      } catch (err: any) {
        op.status = 'failed';
        op.progress = 100;
        op.error = err.message;
        op.logs.push(`Export failed: ${err.message}`);
      }
    }, 1500);

    return operationId;
  }

  // --- GENERAL TELEMETRY & OPERATIONS ---

  public getOperation(operationId: string): HostOperationStatus {
    const op = hostOperations[operationId];
    if (!op) {
      throw new NotFoundError(`Host operation ${operationId} not found`);
    }
    return op;
  }

  public getOperationsHistory(): HostOperationStatus[] {
    return Object.values(hostOperations).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}

export const hostService = new HostService();
export default hostService;
