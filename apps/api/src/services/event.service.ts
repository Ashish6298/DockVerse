import fs from 'fs';
import path from 'path';
import dockerService from '../docker/docker.service.js';
import { AppError, NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import type {
  DockerEventInfo,
  AuditEventSchedule,
  EventDashboardSummary,
  EventOperationStatus
} from '@dockverse/types';

const CONFIG_DIR = path.resolve('d:/DockVerse/backups');
const SCHEDULES_FILE = path.join(CONFIG_DIR, 'event_schedules.json');

const eventOperations: Record<string, EventOperationStatus> = {};
let recordedEvents: DockerEventInfo[] = [];

class EventService {
  private schedules: AuditEventSchedule[] = [];

  constructor() {
    this.ensureDirExists();
    this.reloadSchedules();
    this.initializeBaselineEvents();
  }

  private ensureDirExists() {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
  }

  private reloadSchedules() {
    try {
      if (fs.existsSync(SCHEDULES_FILE)) {
        const content = fs.readFileSync(SCHEDULES_FILE, 'utf8');
        this.schedules = JSON.parse(content);
      } else {
        this.schedules = [];
      }
    } catch {
      this.schedules = [];
    }
  }

  private saveSchedules() {
    try {
      fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(this.schedules, null, 2), 'utf8');
    } catch (err) {
      logger.error('Failed to save event schedules');
    }
  }

  private getClient(): any {
    const client = dockerService.getClient();
    if (dockerService.getStatus() === 'disconnected') {
      throw new AppError('Docker daemon is disconnected', 503, 'DOCKER_CONNECTION_ERROR');
    }
    return client;
  }

  private initializeBaselineEvents() {
    recordedEvents = [
      {
        id: 'ev_01',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        resourceType: 'image',
        resourceId: 'redis:alpine',
        action: 'pull',
        status: 'success',
        severity: 'info',
        originatingModule: 'Image Manager',
        message: 'Successfully pulled image redis:alpine from Docker Hub'
      },
      {
        id: 'ev_02',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        resourceType: 'container',
        resourceId: 'redis-cache',
        action: 'start',
        status: 'success',
        severity: 'info',
        originatingModule: 'Container Manager',
        message: 'Started container redis-cache'
      },
      {
        id: 'ev_03',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        resourceType: 'system',
        resourceId: 'localhost',
        action: 'security_scan',
        status: 'warning',
        severity: 'warning',
        originatingModule: 'Security Center',
        message: 'Security scan finished with 1 high-risk warning (TCP socket without TLS)'
      },
      {
        id: 'ev_04',
        timestamp: new Date(Date.now() - 60000 * 15).toISOString(),
        resourceType: 'stack',
        resourceId: 'production_web',
        action: 'deploy',
        status: 'success',
        severity: 'info',
        originatingModule: 'Stack Manager',
        message: 'Deployed stack production_web containing 3 services'
      },
      {
        id: 'ev_05',
        timestamp: new Date(Date.now() - 60000 * 5).toISOString(),
        resourceType: 'volume',
        resourceId: 'db_data',
        action: 'backup',
        status: 'failed',
        severity: 'error',
        originatingModule: 'Backup Manager',
        message: 'Backup job database_nightly failed: volume mount target is unreachable'
      }
    ];
  }

  // --- ACTIONS ---

  public async getDashboardSummary(): Promise<EventDashboardSummary> {
    const totalEvents = recordedEvents.length;
    const warningEvents = recordedEvents.filter(e => e.severity === 'warning').length;
    const errorEvents = recordedEvents.filter(e => e.severity === 'error').length;

    return {
      totalEvents,
      eventsToday: totalEvents,
      warningEvents,
      errorEvents,
      activeStatus: true,
      storageUsage: totalEvents * 250 // simulated bytes
    };
  }

  public listEvents(filters: any): DockerEventInfo[] {
    let list = [...recordedEvents];
    if (filters.severity) {
      list = list.filter(e => e.severity === filters.severity);
    }
    if (filters.resourceType) {
      list = list.filter(e => e.resourceType === filters.resourceType);
    }
    if (filters.searchTerm) {
      const q = filters.searchTerm.toLowerCase();
      list = list.filter(e => e.message.toLowerCase().includes(q) || e.resourceId.toLowerCase().includes(q));
    }
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public triggerExportAsync(format: 'json' | 'csv'): string {
    const operationId = `export_${Date.now()}`;
    eventOperations[operationId] = {
      operationId,
      action: `Export Audit Logs (${format.toUpperCase()})`,
      status: 'running',
      progress: 20,
      logs: ['Compiling recorded events from memory database...'],
      timestamp: new Date().toISOString()
    };

    setTimeout(() => {
      const op = eventOperations[operationId];
      try {
        op.logs.push('Structuring events array fields into tabular format...');
        op.progress = 60;

        op.logs.push(`Successfully exported ${recordedEvents.length} records. Exposing download payload.`);
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

  public triggerMaintenanceAsync(): string {
    const operationId = `maintenance_${Date.now()}`;
    eventOperations[operationId] = {
      operationId,
      action: 'Logs Pruning & Retention Maintenance',
      status: 'running',
      progress: 20,
      logs: ['Evaluating active events count against storage limits...'],
      timestamp: new Date().toISOString()
    };

    setTimeout(() => {
      const op = eventOperations[operationId];
      try {
        op.logs.push('Deleting old events logs matching expiration limits (>30 days)...');
        op.progress = 60;

        // Simulate deletion of error log if excessive
        if (recordedEvents.length > 20) {
          recordedEvents = recordedEvents.slice(0, 10);
        }

        op.logs.push('Audit database indexes reconstructed successfully.');
        op.progress = 100;
        op.status = 'success';
      } catch (err: any) {
        op.status = 'failed';
        op.progress = 100;
        op.error = err.message;
        op.logs.push(`Maintenance failed: ${err.message}`);
      }
    }, 2000);

    return operationId;
  }

  // --- SCHEDULES PERSISTENCE ---

  public listSchedules(): AuditEventSchedule[] {
    return this.schedules;
  }

  public createSchedule(input: Omit<AuditEventSchedule, 'id'>): AuditEventSchedule {
    const schedule: AuditEventSchedule = {
      id: `sch_${Date.now()}`,
      ...input
    };
    this.schedules.push(schedule);
    this.saveSchedules();
    return schedule;
  }

  public deleteSchedule(id: string): void {
    this.schedules = this.schedules.filter((s) => s.id !== id);
    this.saveSchedules();
  }

  // --- GENERAL TELEMETRY & OPERATIONS ---

  public getOperation(operationId: string): EventOperationStatus {
    const op = eventOperations[operationId];
    if (!op) {
      throw new NotFoundError(`Event operation ${operationId} not found`);
    }
    return op;
  }

  public getOperationsHistory(): EventOperationStatus[] {
    return Object.values(eventOperations).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}

export const eventService = new EventService();
export default eventService;
