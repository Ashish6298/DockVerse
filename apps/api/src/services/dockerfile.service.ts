import dockerService from '../docker/docker.service.js';
import { NotFoundError, AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import type { 
  DockerfileTemplate, 
  DockerfileValidationResult, 
  DockerfileAnalysis, 
  DockerBuildProgress,
  DockerBuildHistory
} from '@dockverse/types';
import tar from 'tar-stream';

// In-memory logs store for active and completed builds
const buildStore: Record<string, {
  buildId: string;
  name: string;
  tag: string;
  status: 'building' | 'success' | 'failed';
  timestamp: string;
  logs: string[];
  error?: string;
}> = {};

class DockerfileService {
  private getClient() {
    const client = dockerService.getClient();
    if (dockerService.getStatus() === 'disconnected') {
      throw new AppError('Docker daemon is disconnected', 503, 'DOCKER_CONNECTION_ERROR');
    }
    return client;
  }

  public getTemplates(): DockerfileTemplate[] {
    return [
      {
        name: 'Node.js Application',
        description: 'Standard template for Node.js React/Express applications',
        content: `FROM node:20-alpine\n\nWORKDIR /app\n\nCOPY package*.json ./\nRUN npm ci --only=production\n\nCOPY . .\n\nEXPOSE 3000\n\nCMD ["node", "server.js"]\n`
      },
      {
        name: 'Python Service',
        description: 'Template for Python Flask/FastAPI backend applications',
        content: `FROM python:3.11-slim\n\nWORKDIR /app\n\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\n\nCOPY . .\n\nEXPOSE 8000\n\nCMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]\n`
      },
      {
        name: 'Go REST API',
        description: 'Multi-stage build template for compiled Go application binaries',
        content: `# Build stage\nFROM golang:1.21-alpine AS builder\nWORKDIR /app\nCOPY . .\nRUN go build -o main .\n\n# Run stage\nFROM alpine:latest\nWORKDIR /app\nCOPY --from=builder /app/main .\nEXPOSE 8080\nCMD ["./main"]\n`
      },
      {
        name: 'Static Nginx Server',
        description: 'Single-stage web server hosting static frontend build assets',
        content: `FROM nginx:alpine\n\nCOPY dist/ /usr/share/nginx/html/\n\nEXPOSE 80\n\nCMD ["nginx", "-g", "daemon off;"]\n`
      }
    ];
  }

  public validateDockerfile(content: string): DockerfileValidationResult {
    const lines = content.split('\n');
    const errors: DockerfileValidationResult['errors'] = [];
    const validInstructions = new Set([
      'FROM', 'RUN', 'CMD', 'LABEL', 'EXPOSE', 'ENV', 'ADD', 'COPY', 
      'ENTRYPOINT', 'VOLUME', 'USER', 'WORKDIR', 'ARG', 'ONBUILD', 
      'STOPSIGNAL', 'HEALTHCHECK', 'SHELL'
    ]);

    let foundFrom = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Skip empty or comments
      if (!line || line.startsWith('#')) {
        continue;
      }

      const match = line.match(/^([A-Z]+)\b/);
      if (!match) {
        errors.push({
          line: i + 1,
          instruction: '<unknown>',
          message: 'Line must start with a valid instruction name (uppercase)',
          severity: 'error'
        });
        continue;
      }

      const inst = match[1];
      if (!validInstructions.has(inst)) {
        errors.push({
          line: i + 1,
          instruction: inst,
          message: `Instruction "${inst}" is not a recognized Dockerfile command`,
          severity: 'error'
        });
      }

      if (inst === 'FROM') {
        foundFrom = true;
      }

      if (!foundFrom && inst !== 'ARG') {
        errors.push({
          line: i + 1,
          instruction: inst,
          message: 'FROM instruction must precede all other instructions (except ARG)',
          severity: 'error'
        });
      }

      if (inst === 'EXPOSE') {
        const portsPart = line.substring(inst.length).trim();
        const ports = portsPart.split(/\s+/);
        for (const port of ports) {
          if (!/^\d+(\/(tcp|udp))?$/.test(port)) {
            errors.push({
              line: i + 1,
              instruction: 'EXPOSE',
              message: `Port "${port}" must be numeric (e.g. 80, 80/tcp)`,
              severity: 'warning'
            });
          }
        }
      }
    }

    if (!foundFrom) {
      errors.push({
        line: 1,
        instruction: '<missing>',
        message: 'Missing FROM instruction. A valid Dockerfile must declare a base image.',
        severity: 'error'
      });
    }

    return {
      isValid: !errors.some(e => e.severity === 'error'),
      errors
    };
  }

  public analyzeDockerfile(content: string): DockerfileAnalysis {
    const lines = content.split('\n');
    const instructions: DockerfileAnalysis['instructions'] = [];
    const stages: string[] = [];
    let baseImage = 'unknown';
    const ports: number[] = [];
    const envs: string[] = [];
    const volumePaths: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#')) {
        continue;
      }

      const match = line.match(/^([A-Z]+)\b/);
      if (match) {
        const inst = match[1];
        const args = line.substring(inst.length).trim();
        instructions.push({
          instruction: inst,
          arguments: args,
          line: i + 1
        });

        if (inst === 'FROM') {
          // Extract base image and stage name if AS is present
          const parts = args.split(/\s+/);
          const base = parts[0];
          if (baseImage === 'unknown') {
            baseImage = base;
          }
          const asIdx = parts.findIndex(p => p.toUpperCase() === 'AS');
          if (asIdx !== -1 && parts[asIdx + 1]) {
            stages.push(parts[asIdx + 1]);
          } else {
            stages.push(base);
          }
        } else if (inst === 'EXPOSE') {
          const rawPorts = args.split(/\s+/);
          for (const rp of rawPorts) {
            const num = parseInt(rp, 10);
            if (!isNaN(num)) {
              ports.push(num);
            }
          }
        } else if (inst === 'ENV') {
          envs.push(args);
        } else if (inst === 'VOLUME') {
          volumePaths.push(args);
        }
      }
    }

    return {
      instructions,
      stages,
      baseImage,
      ports,
      envs,
      volumePaths
    };
  }

  public startBuild(name: string, tag: string, content: string, buildArgs: Record<string, string> = {}): string {
    logger.info({ name, tag }, 'Starting Dockerfile image build in background');
    const client = this.getClient();
    const buildId = Date.now().toString();

    // Initialize build storage state
    buildStore[buildId] = {
      buildId,
      name,
      tag,
      status: 'building',
      timestamp: new Date().toISOString(),
      logs: []
    };

    // Pack Dockerfile content into tar stream
    const pack = tar.pack();
    pack.entry({ name: 'Dockerfile' }, content);
    pack.finalize();

    // Trigger async Docker build stream
    client.buildImage(pack, {
      t: `${name}:${tag}`,
      buildargs: buildArgs
    }, (err: any, stream: any) => {
      if (err) {
        logger.error({ err, buildId }, 'Failed to initiate Docker build stream');
        buildStore[buildId].status = 'failed';
        buildStore[buildId].error = err.message;
        buildStore[buildId].logs.push(`Error initiating build: ${err.message}`);
        return;
      }

      // Demux JSON frame lines
      client.modem.followProgress(
        stream,
        (finishErr: any, output: any) => {
          if (finishErr) {
            logger.error({ err: finishErr, buildId }, 'Build stream failed');
            buildStore[buildId].status = 'failed';
            buildStore[buildId].error = finishErr.message || 'Build stream failed';
            buildStore[buildId].logs.push(`Build finished with error: ${finishErr.message || 'Stream closed'}`);
          } else {
            logger.info({ buildId }, 'Build completed successfully');
            buildStore[buildId].status = 'success';
            buildStore[buildId].logs.push('Image built successfully.');
          }
        },
        (progressEvent: any) => {
          if (progressEvent.stream) {
            buildStore[buildId].logs.push(progressEvent.stream.trim());
          } else if (progressEvent.status) {
            buildStore[buildId].logs.push(progressEvent.status.trim());
          } else if (progressEvent.error) {
            buildStore[buildId].logs.push(`Error: ${progressEvent.error.trim()}`);
            buildStore[buildId].status = 'failed';
            buildStore[buildId].error = progressEvent.error;
          }
        }
      );
    });

    return buildId;
  }

  public getBuildProgress(buildId: string): DockerBuildProgress {
    const build = buildStore[buildId];
    if (!build) {
      throw new NotFoundError(`Build identifier ${buildId} not found`);
    }

    return {
      buildId,
      status: build.status,
      stream: build.logs.join('\n'),
      error: build.error
    };
  }

  public getBuildHistory(): DockerBuildHistory[] {
    return Object.values(buildStore).map(b => ({
      buildId: b.buildId,
      name: b.name,
      tag: b.tag,
      timestamp: b.timestamp,
      success: b.status === 'success',
      logs: b.logs
    })).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
}

export const dockerfileService = new DockerfileService();
export default dockerfileService;
