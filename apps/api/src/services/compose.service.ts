import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import dockerService from '../docker/docker.service.js';
import { AppError, NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import type {
  ComposeProject,
  ComposeServiceDetails,
  ComposeProjectDetails,
  ComposeValidationResult,
  ComposeOperationResponse,
  DockerfileTemplate
} from '@dockverse/types';

// In-memory store for active Compose operations
const operationsStore: Record<string, {
  operationId: string;
  status: 'running' | 'success' | 'failed';
  logs: string[];
  error?: string;
}> = {};

class ComposeService {
  private tempDir = path.resolve('d:/DockVerse/.temp-compose');

  constructor() {
    // Ensure temporary directory exists inside workspace
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  private checkDockerDaemon() {
    if (dockerService.getStatus() === 'disconnected') {
      throw new AppError('Docker daemon is disconnected', 503, 'DOCKER_CONNECTION_ERROR');
    }
  }

  public getTemplates(): DockerfileTemplate[] {
    return [
      {
        name: 'Web Application & PostgreSQL Stack',
        description: 'Multi-service configuration for a Web client and a Postgres database',
        content: `version: '3.8'\n\nservices:\n  web:\n    image: nginx:alpine\n    ports:\n      - "80:80"\n    volumes:\n      - ./html:/usr/share/nginx/html\n    depends_on:\n      - db\n\n  db:\n    image: postgres:15-alpine\n    environment:\n      POSTGRES_USER: user\n      POSTGRES_PASSWORD: secretpassword\n      POSTGRES_DB: main_db\n    volumes:\n      - db-data:/var/lib/postgresql/data\n\nvolumes:\n  db-data:\n`
      },
      {
        name: 'Redis Cache Stack',
        description: 'Redis database server combined with RedisInsight management panel',
        content: `version: '3.8'\n\nservices:\n  redis:\n    image: redis:alpine\n    ports:\n      - "6379:6379"\n    volumes:\n      - redis-data:/data\n\n  insight:\n    image: redislabs/redisinsight:latest\n    ports:\n      - "8001:8001"\n    depends_on:\n      - redis\n\nvolumes:\n  redis-data:\n`
      },
      {
        name: 'Nginx Reverse Proxy Stack',
        description: 'Nginx reverse proxy router mapping requests to node microservices',
        content: `version: '3.8'\n\nservices:\n  proxy:\n    image: nginx:alpine\n    ports:\n      - "8080:80"\n    depends_on:\n      - app1\n      - app2\n\n  app1:\n    image: node:20-alpine\n    environment:\n      PORT: 3000\n    command: ["node", "-e", "console.log('App 1 running')"]\n\n  app2:\n    image: node:20-alpine\n    environment:\n      PORT: 3000\n    command: ["node", "-e", "console.log('App 2 running')"]\n`
      }
    ];
  }

  public validateCompose(content: string): ComposeValidationResult {
    try {
      const doc = YAML.parse(content);
      if (!doc) {
        return { isValid: false, errors: ['Compose file is empty'] };
      }
      if (typeof doc !== 'object') {
        return { isValid: false, errors: ['Compose root must be a valid YAML object'] };
      }
      if (!doc.services || typeof doc.services !== 'object') {
        return { isValid: false, errors: ['Compose file must declare a "services" block object'] };
      }

      const errors: string[] = [];
      const serviceEntries = Object.entries(doc.services);
      if (serviceEntries.length === 0) {
        errors.push('The "services" block must contain at least one service definition');
      }

      for (const [name, config] of serviceEntries) {
        if (!config || typeof config !== 'object') {
          errors.push(`Service "${name}" must declare a valid configuration object`);
          continue;
        }
        const serviceConfig = config as Record<string, any>;
        if (!serviceConfig.image && !serviceConfig.build) {
          errors.push(`Service "${name}" must declare either an "image" reference or a "build" configuration`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error: any) {
      return {
        isValid: false,
        errors: [`YAML Parsing Error: ${error.message || 'Malformed structure'}`],
      };
    }
  }

  public analyzeCompose(content: string): ComposeProjectDetails {
    const doc = YAML.parse(content) || {};
    const servicesObj = doc.services || {};
    const services: ComposeServiceDetails[] = [];

    for (const [sName, sCfg] of Object.entries(servicesObj)) {
      const cfg = (sCfg || {}) as Record<string, any>;
      
      // Parse environment variables dictionary
      const environment: Record<string, string> = {};
      if (cfg.environment) {
        if (Array.isArray(cfg.environment)) {
          for (const item of cfg.environment) {
            const splitIdx = item.indexOf('=');
            if (splitIdx !== -1) {
              const k = item.slice(0, splitIdx).trim();
              const v = item.slice(splitIdx + 1).trim();
              environment[k] = v;
            } else {
              environment[item] = '';
            }
          }
        } else if (typeof cfg.environment === 'object') {
          Object.assign(environment, cfg.environment);
        }
      }

      services.push({
        name: sName,
        image: cfg.image || (cfg.build ? 'build-context' : 'unknown'),
        containerName: cfg.container_name,
        ports: Array.isArray(cfg.ports) ? cfg.ports.map(String) : [],
        volumes: Array.isArray(cfg.volumes) ? cfg.volumes.map(String) : [],
        networks: Array.isArray(cfg.networks) ? cfg.networks.map(String) : [],
        environment,
        dependsOn: Array.isArray(cfg.depends_on) ? cfg.depends_on.map(String) : 
                   (cfg.depends_on && typeof cfg.depends_on === 'object' ? Object.keys(cfg.depends_on) : [])
      });
    }

    return {
      name: doc.name || 'compose-project',
      content,
      services,
    };
  }

  public runComposeCommand(
    projectName: string,
    content: string,
    action: 'up' | 'down' | 'restart' | 'build'
  ): string {
    this.checkDockerDaemon();
    
    // Validate syntax before triggering commands
    const valResult = this.validateCompose(content);
    if (!valResult.isValid) {
      throw new AppError(`Invalid Compose configuration: ${valResult.errors.join(', ')}`, 400);
    }

    const operationId = Date.now().toString();
    const tempFile = path.join(this.tempDir, `${projectName}-${operationId}.yml`);

    // Write Compose YAML context inside temp file
    fs.writeFileSync(tempFile, content, 'utf8');

    operationsStore[operationId] = {
      operationId,
      status: 'running',
      logs: [`Initiating compose ${action} command...`]
    };

    // Determine compose arguments list
    const args: string[] = ['compose', '-p', projectName, '-f', tempFile];
    if (action === 'up') {
      args.push('up', '-d');
    } else if (action === 'down') {
      args.push('down');
    } else if (action === 'restart') {
      args.push('restart');
    } else {
      args.push('build');
    }

    logger.info({ args, projectName, operationId }, 'Spawning Docker Compose command');

    // Spawn docker CLI process
    const child = spawn('docker', args);

    child.stdout.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) {
        operationsStore[operationId].logs.push(msg);
      }
    });

    child.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) {
        operationsStore[operationId].logs.push(msg);
      }
    });

    child.on('close', (code) => {
      logger.info({ code, operationId }, 'Docker Compose command completed');
      
      // Clean up temporary config file
      try {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      } catch (err) {
        logger.error({ err }, 'Failed to delete temporary compose file');
      }

      if (code === 0) {
        operationsStore[operationId].status = 'success';
        operationsStore[operationId].logs.push(`Docker Compose operation finished successfully.`);
      } else {
        operationsStore[operationId].status = 'failed';
        operationsStore[operationId].error = `Exit code ${code}`;
        operationsStore[operationId].logs.push(`Docker Compose command exited with error code ${code}`);
      }
    });

    return operationId;
  }

  public getOperationProgress(operationId: string): ComposeOperationResponse {
    const op = operationsStore[operationId];
    if (!op) {
      throw new NotFoundError(`Compose operation ${operationId} not found`);
    }
    return op;
  }

  public getOperationHistory(): ComposeOperationResponse[] {
    return Object.values(operationsStore);
  }
}

export const composeService = new ComposeService();
export default composeService;
