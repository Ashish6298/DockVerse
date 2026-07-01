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

export interface WorkspaceResource {
  type: 'container' | 'image' | 'network' | 'volume';
  id: string;
}

export interface Workspace {
  _id: string;
  name: string;
  description?: string;
  resources: WorkspaceResource[];
  createdAt: string;
  updatedAt: string;
}

export interface ContainerPortInfo {
  ip?: string;
  privatePort: number;
  publicPort?: number;
  type: string;
}

export interface ContainerListItem {
  id: string;
  name: string;
  image: string;
  command: string;
  created: number;
  state: string;
  status: string;
  ports: ContainerPortInfo[];
  labels: Record<string, string>;
}

export interface ContainerDetails {
  id: string;
  name: string;
  image: string;
  created: string;
  state: {
    status: string;
    running: boolean;
    paused: boolean;
    restarting: boolean;
    oOMKilled: boolean;
    dead: boolean;
    exitCode: number;
    error: string;
    startedAt: string;
    finishedAt: string;
    health?: {
      status: string;
      failingStreak: number;
      log: Array<{
        start: string;
        end: string;
        exitCode: number;
        output: string;
      }>;
    };
  };
  env: string[];
  mounts: Array<{
    type: string;
    name?: string;
    source: string;
    destination: string;
    driver?: string;
    mode: string;
    rw: boolean;
  }>;
  networks: Record<string, {
    gateway: string;
    ipAddress: string;
    macAddress: string;
    aliases?: string[];
  }>;
  ports: Record<string, Array<{ HostIp: string; HostPort: string }>>;
  restartPolicy: {
    name: string;
    maximumRetryCount: number;
  };
  labels: Record<string, string>;
  limits: {
    memory: number;
    nanoCpus: number;
  };
}

export interface ImageListItem {
  id: string;
  tags: string[];
  size: number;
  created: number;
  labels: Record<string, string>;
}

export interface ImageDetails {
  id: string;
  tags: string[];
  size: number;
  created: string;
  os: string;
  architecture: string;
  author?: string;
  comment?: string;
  dockerVersion?: string;
  env?: string[];
  cmd?: string[];
  entrypoint?: string[];
  labels?: Record<string, string>;
}

export interface ImageHistoryItem {
  id: string;
  created: number;
  createdBy: string;
  size: number;
  tags?: string[];
}

export interface NetworkListItem {
  id: string;
  name: string;
  driver: string;
  scope: string;
  attachable: boolean;
  internal: boolean;
  ingress: boolean;
  enableIPv6: boolean;
  labels: Record<string, string>;
}

export interface NetworkDetails {
  id: string;
  name: string;
  driver: string;
  scope: string;
  attachable: boolean;
  internal: boolean;
  ingress: boolean;
  enableIPv6: boolean;
  ipam: {
    driver: string;
    config: Array<{ subnet?: string; gateway?: string }>;
  };
  containers: Record<string, {
    name: string;
    endpointId: string;
    macAddress: string;
    ipv4Address: string;
    ipv6Address: string;
  }>;
  labels: Record<string, string>;
}

export interface VolumeUsageInfo {
  size: number;
  refCount: number;
}

export interface VolumeSummary {
  name: string;
  driver: string;
  mountpoint: string;
  scope: string;
  labels: Record<string, string>;
  usageData?: VolumeUsageInfo;
}

export interface VolumeDetails {
  name: string;
  driver: string;
  mountpoint: string;
  scope: string;
  labels: Record<string, string>;
  options?: Record<string, string>;
  status?: Record<string, unknown>;
  usageData?: VolumeUsageInfo;
}

export interface VolumeCreateRequest {
  name: string;
  driver?: string;
  driverOpts?: Record<string, string>;
  labels?: Record<string, string>;
}

export interface VolumeCreateResponse {
  name: string;
  driver: string;
  mountpoint: string;
  scope: string;
  labels: Record<string, string>;
}

export interface VolumeListResponse {
  volumes: VolumeSummary[];
  warnings?: string[];
}

export interface VolumeDeleteResponse {
  success: boolean;
}

export interface VolumePruneResponse {
  spaceReclaimed: number;
  volumesDeleted: string[];
}

export interface DockerfileTemplate {
  name: string;
  description: string;
  content: string;
}

export interface DockerfileSyntaxError {
  line: number;
  instruction: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface DockerfileValidationResult {
  isValid: boolean;
  errors: DockerfileSyntaxError[];
}

export interface DockerfileInstruction {
  instruction: string;
  arguments: string;
  line: number;
}

export interface DockerfileAnalysis {
  instructions: DockerfileInstruction[];
  stages: string[];
  baseImage: string;
  ports: number[];
  envs: string[];
  volumePaths: string[];
}

export interface DockerBuildRequest {
  name: string;
  tag: string;
  content: string;
  buildArgs?: Record<string, string>;
}

export interface DockerBuildProgress {
  buildId: string;
  status: string;
  progress?: string;
  detail?: string;
  stream?: string;
  error?: string;
}

export interface DockerBuildResult {
  success: boolean;
  imageId?: string;
  logs: string[];
  error?: string;
}

export interface DockerBuildHistory {
  buildId: string;
  name: string;
  tag: string;
  timestamp: string;
  success: boolean;
  logs: string[];
}

export interface ComposeServiceDetails {
  name: string;
  image: string;
  containerName?: string;
  ports?: string[];
  volumes?: string[];
  networks?: string[];
  environment?: Record<string, string>;
  dependsOn?: string[];
}

export interface ComposeProject {
  name: string;
  filePath: string;
  services: string[];
  status: string;
}

export interface ComposeProjectDetails {
  name: string;
  content: string;
  services: ComposeServiceDetails[];
}

export interface ComposeValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ComposeCommandRequest {
  projectName: string;
  content: string;
}

export interface ComposeOperationResponse {
  operationId: string;
  status: 'running' | 'success' | 'failed';
  logs: string[];
  error?: string;
}

export interface ContainerMetricPoint {
  timestamp: string;
  cpuPercent: number;
  memoryBytes: number;
  memoryPercent: number;
  networkRxBytes: number;
  networkTxBytes: number;
  ioReadBytes: number;
  ioWriteBytes: number;
}

export interface ContainerMetricsHistory {
  containerId: string;
  points: ContainerMetricPoint[];
}

export interface MonitoringSummary {
  totalCpuPercent: number;
  totalMemoryBytes: number;
  totalNetworkRxBytes: number;
  totalNetworkTxBytes: number;
  runningContainersCount: number;
}

export interface RegistryProvider {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected';
  url: string;
}

export interface RegistryRepository {
  name: string;
  namespace?: string;
  description?: string;
  starsCount?: number;
  pullsCount?: number;
}

export interface RegistryTag {
  name: string;
  digest: string;
  sizeBytes?: number;
  lastUpdated?: string;
}

export interface RegistryLayer {
  mediaType: string;
  digest: string;
  sizeBytes: number;
}

export interface RegistryManifest {
  schemaVersion: number;
  mediaType: string;
  configDigest?: string;
  layers: RegistryLayer[];
}

export interface RegistryOperation {
  operationId: string;
  status: 'running' | 'success' | 'failed';
  logs: string[];
  error?: string;
}

export interface RegistryAuthentication {
  username?: string;
  email?: string;
  token?: string;
}

export interface RegistrySearchResult {
  totalCount: number;
  repositories: RegistryRepository[];
}

export interface RegistryHealth {
  status: 'ok' | 'degraded' | 'down';
}

export interface RegistryRateLimit {
  limit: number;
  remaining: number;
  resetTime?: string;
}

export interface RegistryError {
  message: string;
  code: string;
}





