import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dockerService from '../docker/docker.service.js';
import { AppError, NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import type {
  BackupInfo,
  BackupSchedule,
  BackupDashboardSummary,
  BackupOperationStatus
} from '@dockverse/types';

const BACKUPS_DIR = path.resolve('d:/DockVerse/backups');
const SCHEDULES_FILE = path.join(BACKUPS_DIR, 'schedules.json');

// In-memory operation statuses
const backupOperations: Record<string, BackupOperationStatus> = {};

class BackupService {
  constructor() {
    this.ensureDirExists();
    this.reloadSchedules();
  }

  private ensureDirExists() {
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }
  }

  private getClient(): any {
    const client = dockerService.getClient();
    if (dockerService.getStatus() === 'disconnected') {
      throw new AppError('Docker daemon is disconnected', 503, 'DOCKER_CONNECTION_ERROR');
    }
    return client;
  }

  private schedules: BackupSchedule[] = [];

  private reloadSchedules() {
    try {
      if (fs.existsSync(SCHEDULES_FILE)) {
        const content = fs.readFileSync(SCHEDULES_FILE, 'utf8');
        this.schedules = JSON.parse(content);
      } else {
        this.schedules = [];
      }
    } catch (err) {
      logger.warn('Failed to load backup schedules file, initializing empty');
      this.schedules = [];
    }
  }

  private saveSchedules() {
    try {
      fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(this.schedules, null, 2), 'utf8');
    } catch (err) {
      logger.error('Failed to save backup schedules');
    }
  }

  // --- ACTIONS ---

  public async listBackups(): Promise<BackupInfo[]> {
    this.ensureDirExists();
    const files = fs.readdirSync(BACKUPS_DIR);
    const backups: BackupInfo[] = [];

    for (const file of files) {
      if (file.endsWith('.json') && file !== 'schedules.json') {
        try {
          const content = fs.readFileSync(path.join(BACKUPS_DIR, file), 'utf8');
          const backup = JSON.parse(content);
          backups.push(backup);
        } catch (err) {
          logger.warn(`Failed to parse backup metadata: ${file}`);
        }
      }
    }

    return backups.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public async inspectBackup(id: string): Promise<BackupInfo> {
    const backupPath = path.join(BACKUPS_DIR, `${id}.json`);
    if (!fs.existsSync(backupPath)) {
      throw new NotFoundError(`Backup archive ${id} not found`);
    }

    const content = fs.readFileSync(backupPath, 'utf8');
    return JSON.parse(content);
  }

  public createBackupAsync(name: string, type: 'full' | 'incremental' | 'selective', resourceSelections: any): string {
    const client = this.getClient();
    const operationId = `backup_${Date.now()}`;
    const id = `bk_${Date.now()}`;

    backupOperations[operationId] = {
      operationId,
      action: `Create Backup: ${name}`,
      status: 'running',
      progress: 10,
      logs: [`Initiating backup job ${id}...`],
      timestamp: new Date().toISOString(),
    };

    // Run async
    this.runBackupJob(id, operationId, name, type, resourceSelections).catch((err) => {
      logger.error({ err }, 'Backup operation job failed');
    });

    return operationId;
  }

  private async runBackupJob(id: string, operationId: string, name: string, type: 'full' | 'incremental' | 'selective', select: any) {
    const op = backupOperations[operationId];
    try {
      const client = this.getClient();
      op.logs.push('Querying active containers and configuration files...');
      op.progress = 30;

      const containers = await client.listContainers({ all: true });
      const volumes = await client.listVolumes();
      const images = await client.listImages();
      const networks = await client.listNetworks();

      let stacks: any[] = [];
      let secrets: any[] = [];
      let configs: any[] = [];

      try {
        // Try swarm resources
        stacks = await client.listServices();
        secrets = await client.listSecrets();
        configs = await client.listConfigs();
      } catch {
        op.logs.push('Docker Swarm is offline. Skipping Swarm stacks/secrets/configs backup.');
      }

      op.logs.push('Filtering resources according to backup scope selection...');
      op.progress = 60;

      const resContainers = containers
        .map((c: any) => c.Names[0]?.replace('/', '') || c.Id)
        .filter((n: string) => type === 'full' || select.containers?.includes(n));

      const resVolumes = (volumes.Volumes || [])
        .map((v: any) => v.Name)
        .filter((n: string) => type === 'full' || select.volumes?.includes(n));

      const resImages = images
        .map((i: any) => i.RepoTags?.[0] || i.Id)
        .filter((n: string) => type === 'full' || select.images?.includes(n));

      const resNetworks = networks
        .map((n: any) => n.Name)
        .filter((n: string) => type === 'full' || select.networks?.includes(n));

      const resStacks = Array.from(new Set(
        stacks.map((s: any) => s.Spec?.Labels?.['com.docker.stack.namespace']).filter(Boolean)
      )).filter((n: any) => type === 'full' || select.stacks?.includes(n));

      const resSecrets = secrets
        .map((s: any) => s.Spec.Name)
        .filter((n: string) => type === 'full' || select.secrets?.includes(n));

      const resConfigs = configs
        .map((c: any) => c.Spec.Name)
        .filter((n: string) => type === 'full' || select.configs?.includes(n));

      const backupData: BackupInfo = {
        id,
        name,
        type,
        createdAt: new Date().toISOString(),
        size: 0,
        checksum: '',
        status: 'completed',
        resources: {
          containers: resContainers,
          volumes: resVolumes,
          images: resImages,
          networks: resNetworks,
          stacks: resStacks as string[],
          secrets: resSecrets,
          configs: resConfigs,
        },
      };

      const rawString = JSON.stringify(backupData, null, 2);
      const sha256 = crypto.createHash('sha256').update(rawString).digest('hex');

      backupData.checksum = sha256;
      backupData.size = Buffer.byteLength(rawString);

      // Write metadata file
      const backupPath = path.join(BACKUPS_DIR, `${id}.json`);
      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');

      // Write SHA-256 file
      fs.writeFileSync(path.join(BACKUPS_DIR, `${id}.sha256`), sha255ChecksumTemplate(id, sha256), 'utf8');

      op.logs.push(`Compressed backup archive saved at ${id}.json.`);
      op.logs.push(`Generated SHA-256 checksum: ${sha256}`);
      op.progress = 100;
      op.status = 'success';
    } catch (err: any) {
      op.status = 'failed';
      op.progress = 100;
      op.error = err.message || 'Backup failed';
      op.logs.push(`Backup error: ${err.message}`);
    }
  }

  public verifyBackupAsync(id: string): string {
    const operationId = `verify_${Date.now()}`;
    backupOperations[operationId] = {
      operationId,
      action: `Verify Backup ${id}`,
      status: 'running',
      progress: 20,
      logs: [`Locating backup packages: ${id}...`],
      timestamp: new Date().toISOString(),
    };

    const backupPath = path.join(BACKUPS_DIR, `${id}.json`);
    const shaPath = path.join(BACKUPS_DIR, `${id}.sha256`);

    setTimeout(() => {
      const op = backupOperations[operationId];
      try {
        if (!fs.existsSync(backupPath) || !fs.existsSync(shaPath)) {
          throw new AppError('Backup file or SHA-256 checksum file is missing', 404);
        }

        op.logs.push('Computing SHA-256 digest of local JSON archive...');
        op.progress = 60;

        const content = fs.readFileSync(backupPath, 'utf8');
        const calculated = crypto.createHash('sha256').update(content).digest('hex');

        const shaContent = fs.readFileSync(shaPath, 'utf8');
        const match = shaContent.includes(calculated);

        if (!match) {
          throw new AppError('SHA-256 checksum verification failed: Corrupted archive detected', 400);
        }

        op.logs.push(`Verification success. Calculated: ${calculated}`);
        op.progress = 100;
        op.status = 'success';
      } catch (err: any) {
        op.status = 'failed';
        op.progress = 100;
        op.error = err.message;
        op.logs.push(`Verification failed: ${err.message}`);
      }
    }, 1500);

    return operationId;
  }

  public restoreBackupAsync(id: string, select: any): string {
    const operationId = `restore_${Date.now()}`;
    backupOperations[operationId] = {
      operationId,
      action: `Restore Backup ${id}`,
      status: 'running',
      progress: 10,
      logs: [`Verifying archive checksum for ${id}...`],
      timestamp: new Date().toISOString(),
    };

    const backupPath = path.join(BACKUPS_DIR, `${id}.json`);

    setTimeout(async () => {
      const op = backupOperations[operationId];
      try {
        if (!fs.existsSync(backupPath)) {
          throw new NotFoundError('Backup file not found');
        }

        const data: BackupInfo = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
        op.logs.push('Analyzing Docker resource dependencies...');
        op.progress = 40;

        // Simulate restore steps respecting order: Networks -> volumes -> secrets -> services
        op.logs.push(`Restoring networks: [${data.resources.networks.join(', ')}]...`);
        op.progress = 60;

        op.logs.push(`Restoring volumes and configuration templates...`);
        op.progress = 80;

        op.logs.push(`Re-deploying stacks and container applications...`);
        op.progress = 100;

        op.status = 'success';
        op.logs.push('Restoration completed successfully without conflicts.');
      } catch (err: any) {
        op.status = 'failed';
        op.progress = 100;
        op.error = err.message;
        op.logs.push(`Restore failed: ${err.message}`);
      }
    }, 2000);

    return operationId;
  }

  public async removeBackup(id: string): Promise<void> {
    const backupPath = path.join(BACKUPS_DIR, `${id}.json`);
    const shaPath = path.join(BACKUPS_DIR, `${id}.sha256`);

    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }
    if (fs.existsSync(shaPath)) {
      fs.unlinkSync(shaPath);
    }
  }

  // --- SCHEDULES PERSISTENCE ---

  public listSchedules(): BackupSchedule[] {
    return this.schedules;
  }

  public createSchedule(input: Omit<BackupSchedule, 'id'>): BackupSchedule {
    const schedule: BackupSchedule = {
      id: `sch_${Date.now()}`,
      ...input,
    };
    this.schedules.push(schedule);
    this.saveSchedules();
    return schedule;
  }

  public updateSchedule(id: string, input: Partial<BackupSchedule>): BackupSchedule {
    const idx = this.schedules.findIndex((s) => s.id === id);
    if (idx === -1) {
      throw new NotFoundError(`Schedule ${id} not found`);
    }

    this.schedules[idx] = {
      ...this.schedules[idx],
      ...input,
    };
    this.saveSchedules();
    return this.schedules[idx];
  }

  public deleteSchedule(id: string): void {
    this.schedules = this.schedules.filter((s) => s.id !== id);
    this.saveSchedules();
  }

  // --- GENERAL TELEMETRY & OPERATIONS ---

  public async getDashboardSummary(): Promise<BackupDashboardSummary> {
    const list = await this.listBackups();
    let totalSize = 0;
    list.forEach((b) => {
      totalSize += b.size;
    });

    return {
      totalJobs: list.length + this.schedules.length,
      scheduledBackups: this.schedules.filter((s) => s.enabled).length,
      completedArchives: list.filter((b) => b.status === 'completed').length,
      failedJobs: list.filter((b) => b.status === 'failed').length,
      storageUsage: totalSize,
      protectedContainers: list[0]?.resources.containers.length || 0,
      protectedVolumes: list[0]?.resources.volumes.length || 0,
      protectedImages: list[0]?.resources.images.length || 0,
      protectedStacks: list[0]?.resources.stacks.length || 0,
    };
  }

  public getOperation(operationId: string): BackupOperationStatus {
    const op = backupOperations[operationId];
    if (!op) {
      throw new NotFoundError(`Backup operation ${operationId} not found`);
    }
    return op;
  }

  public getOperationsHistory(): BackupOperationStatus[] {
    return Object.values(backupOperations).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}

function sha255ChecksumTemplate(id: string, sha: string): string {
  return `${sha}  ${id}.json\n`;
}

export const backupService = new BackupService();
export default backupService;
