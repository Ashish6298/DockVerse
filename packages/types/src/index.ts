export interface SystemInformation {
  version: string;
  apiVersion: string;
  os: string;
  arch: string;
  cpus: number;
  memory: number; // bytes
  dockerRootDir: string;
  uptime?: number; // server uptime if available
}

export interface DockerInfo {
  system: SystemInformation;
  containers: {
    total: number;
    running: number;
    stopped: number;
    paused: number;
  };
  images: {
    total: number;
  };
  networks: {
    total: number;
  };
  volumes: {
    total: number;
  };
}

export type DockerStatus = 'connected' | 'disconnected';

export interface DashboardSummary {
  info: DockerInfo | null;
  status: DockerStatus;
  timestamp: string;
}

export interface ApiResponse<T = unknown> {
  success: true;
  timestamp: string;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  timestamp: string;
  message: string;
  error?: string;
  code?: string;
}

