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

export interface PluginPrivilege {
  Name: string;
  Description: string;
  Value: string[];
}

export interface PluginSettings {
  Env: string[];
  Mounts: Array<{
    Name: string;
    Description: string;
    Settable: string[];
    Source: string;
    Destination: string;
    Type: string;
    Options: string[];
  }>;
  Devices: Array<{
    Name: string;
    Description: string;
    Settable: string[];
    Path: string;
  }>;
}

export interface PluginListItem {
  Id: string;
  Name: string;
  Tag?: string;
  Active: boolean;
  Enabled: boolean;
  Config: {
    DockerVersion?: string;
    Description?: string;
    Documentation?: string;
    Interface?: {
      Types: string[];
      Socket: string;
    };
    Entrypoint?: string[];
    WorkDir?: string;
    Env?: Array<{
      Name: string;
      Description: string;
      Settable: string[];
      Value: string;
    }>;
    Mounts?: Array<{
      Name: string;
      Description: string;
      Settable: string[];
      Source: string;
      Destination: string;
      Type: string;
      Options: string[];
    }>;
    Devices?: Array<{
      Name: string;
      Description: string;
      Settable: string[];
      Path: string;
    }>;
  };
}

export interface PluginDetails extends PluginListItem {
  Privileges: PluginPrivilege[];
}

export interface PluginInstallRequest {
  remoteName: string;
  alias?: string;
  grantPrivileges: boolean;
  options?: Record<string, string>;
}

export interface PluginUpdateRequest {
  remoteName: string;
  grantPrivileges?: boolean;
}

export interface PluginConfigureRequest {
  env?: Record<string, string>;
}

export interface PluginOperationResponse {
  operationId: string;
  status: 'running' | 'success' | 'failed';
  logs: string[];
  error?: string;
}

export interface SwarmClusterInfo {
  id: string;
  createdAt: string;
  updatedAt: string;
  spec: {
    name: string;
    labels: Record<string, string>;
    orchestration: {
      taskHistoryRetentionLimit: number;
    };
    raft: {
      snapshotInterval: number;
      keepOldSnapshots: number;
      logEntriesForSlowFollowers: number;
      electionTick: number;
      heartbeatTick: number;
    };
    caConfig: {
      nodeCertExpiry: number;
      externalCAs?: Array<{
        protocol: string;
        uRL: string;
        options?: Record<string, string>;
      }>;
    };
    encryptionConfig: {
      autoLockManagers: boolean;
    };
    dispatcher: {
      heartbeatPeriod: number;
    };
  };
  version: {
    index: number;
  };
}

export interface SwarmNodeInfo {
  id: string;
  version: {
    index: number;
  };
  createdAt: string;
  updatedAt: string;
  spec: {
    name?: string;
    labels: Record<string, string>;
    role: 'manager' | 'worker';
    availability: 'active' | 'pause' | 'drain';
  };
  description: {
    hostname: string;
    platform: {
      architecture: string;
      os: string;
    };
    resources: {
      nanoCPUs: number;
      memoryBytes: number;
    };
    engine: {
      engineVersion: string;
      labels: Record<string, string>;
      plugins: Array<{ type: string; name: string }>;
    };
    tlsInfo?: {
      trustRoot?: string;
      certIssuerSubject?: string;
      certIssuerPublicKey?: string;
    };
  };
  status: {
    state: 'unknown' | 'down' | 'ready' | 'disconnected';
    message?: string;
    addr?: string;
  };
  managerStatus?: {
    leader?: boolean;
    reachability: 'unknown' | 'unreachable' | 'reachable';
    addr: string;
  };
}

export interface SwarmJoinRequest {
  listenAddr?: string;
  advertiseAddr?: string;
  dataPathAddr?: string;
  remoteAddrs: string[];
  joinToken: string;
}

export interface SwarmInitRequest {
  listenAddr?: string;
  advertiseAddr?: string;
  dataPathAddr?: string;
  forceNewCluster?: boolean;
  spec?: {
    name?: string;
    labels?: Record<string, string>;
    orchestration?: {
      taskHistoryRetentionLimit?: number;
    };
    raft?: {
      snapshotInterval?: number;
      keepOldSnapshots?: number;
      logEntriesForSlowFollowers?: number;
      electionTick?: number;
      heartbeatTick?: number;
    };
    caConfig?: {
      nodeCertExpiry?: number;
      externalCAs?: Array<{
        protocol: string;
        uRL: string;
        options?: Record<string, string>;
      }>;
    };
    encryptionConfig?: {
      autoLockManagers?: boolean;
    };
    dispatcher?: {
      heartbeatPeriod?: number;
    };
  };
}

export interface SwarmLeaveRequest {
  force?: boolean;
}

export interface SwarmTokenInfo {
  manager: string;
  worker: string;
}

export interface SwarmOperationStatus {
  operationId: string;
  action: string;
  status: 'running' | 'success' | 'failed';
  progress: number;
  logs: string[];
  error?: string;
  timestamp: string;
}

export interface SwarmServiceInfo {
  id: string;
  version: {
    index: number;
  };
  createdAt: string;
  updatedAt: string;
  spec: {
    name: string;
    labels: Record<string, string>;
    mode: {
      replicated?: {
        replicas: number;
      };
      global?: Record<string, unknown>;
    };
    taskTemplate: {
      containerSpec: {
        image: string;
        env?: string[];
        mounts?: Array<{
          type: string;
          source: string;
          target: string;
          readOnly?: boolean;
        }>;
        secrets?: Array<{
          file?: {
            name: string;
            uID: string;
            gID: string;
            mode: number;
          };
          secretID: string;
          secretName: string;
        }>;
        configs?: Array<{
          file?: {
            name: string;
            uID: string;
            gID: string;
            mode: number;
          };
          configID: string;
          configName: string;
        }>;
      };
      resources?: {
        limits?: {
          nanoCPUs?: number;
          memoryBytes?: number;
        };
        reservations?: {
          nanoCPUs?: number;
          memoryBytes?: number;
        };
      };
      restartPolicy?: {
        condition: 'none' | 'on-failure' | 'any';
        delay?: number;
        maxAttempts?: number;
        window?: number;
      };
      placement?: {
        constraints?: string[];
      };
      logDriver?: {
        name: string;
        options?: Record<string, string>;
      };
    };
    updateConfig?: {
      parallelism?: number;
      delay?: number;
      failureAction?: 'pause' | 'continue' | 'rollback';
      monitor?: number;
      maxFailureRatio?: number;
      order?: 'stop-first' | 'start-first';
    };
    rollbackConfig?: {
      parallelism?: number;
      delay?: number;
      failureAction?: 'pause' | 'continue';
      monitor?: number;
      maxFailureRatio?: number;
      order?: 'stop-first' | 'start-first';
    };
  };
  endpoint?: {
    spec?: {
      mode?: string;
      ports?: Array<{
        protocol: string;
        targetPort: number;
        publishedPort?: number;
        publishMode?: string;
      }>;
    };
    ports?: Array<{
      protocol: string;
      targetPort: number;
      publishedPort?: number;
      publishMode?: string;
    }>;
    virtualIPs?: Array<{
      networkID: string;
      addr: string;
    }>;
  };
  updateStatus?: {
    state: 'updating' | 'paused' | 'completed' | 'rollback-started' | 'rollback-paused' | 'rollback-completed';
    startedAt?: string;
    completedAt?: string;
    message?: string;
  };
}

export interface SwarmTaskInfo {
  id: string;
  version: {
    index: number;
  };
  createdAt: string;
  updatedAt: string;
  name?: string;
  labels?: Record<string, string>;
  spec: {
    containerSpec: {
      image: string;
    };
  };
  serviceID: string;
  slot?: number;
  nodeID: string;
  status: {
    timestamp: string;
    state: 'new' | 'allocated' | 'pending' | 'assigned' | 'accepted' | 'preparing' | 'starting' | 'running' | 'complete' | 'failed' | 'shutdown' | 'rejected' | 'orphaned' | 'remove';
    message?: string;
    err?: string;
    containerStatus?: {
      containerID: string;
      pID: number;
      exitCode: number;
    };
  };
  desiredState: string;
}

export interface SwarmManagerInfo {
  total: number;
  active: number;
  unreachable: number;
}

export interface SwarmWorkerInfo {
  total: number;
  active: number;
  drain: number;
  pause: number;
}

export interface SwarmClusterHealth {
  status: 'healthy' | 'degraded' | 'critical' | 'inactive';
  managers: SwarmManagerInfo;
  workers: SwarmWorkerInfo;
  unhealthyNodes: string[];
  pendingTasks: number;
  failedTasks: number;
  schedulingErrors: number;
  resourceUtilization: {
    totalCpu: number;
    totalMemoryBytes: number;
  };
  timestamp: string;
}

export interface SwarmSpecUpdateRequest {
  version: number;
  spec?: SwarmInitRequest['spec'];
}

export interface SwarmUnlockKeyInfo {
  unlockKey: string;
}

export interface SwarmOperationProgress {
  operationId: string;
  status: 'running' | 'success' | 'failed';
  logs: string[];
  error?: string;
}

export interface SwarmStatistics {
  nodeCount: number;
  serviceCount: number;
  taskCount: number;
}

export interface SecretInfo {
  id: string;
  version: {
    index: number;
  };
  createdAt: string;
  updatedAt: string;
  spec: {
    name: string;
    labels: Record<string, string>;
    driver?: {
      name: string;
      options?: Record<string, string>;
    };
    templating?: {
      name: string;
      options?: Record<string, string>;
    };
  };
}

export interface ConfigInfo {
  id: string;
  version: {
    index: number;
  };
  createdAt: string;
  updatedAt: string;
  spec: {
    name: string;
    labels: Record<string, string>;
    templating?: {
      name: string;
      options?: Record<string, string>;
    };
  };
}

export interface SecretCreateRequest {
  name: string;
  labels?: Record<string, string>;
  data: string;
  isBase64?: boolean;
}

export interface ConfigCreateRequest {
  name: string;
  labels?: Record<string, string>;
  data: string;
}

export interface SecretInspectResponse extends SecretInfo {}
export interface ConfigInspectResponse extends ConfigInfo {}

export interface SecretReference {
  serviceId: string;
  serviceName: string;
  targetPath: string;
  uID: string;
  gID: string;
  mode: number;
}

export interface ConfigReference {
  serviceId: string;
  serviceName: string;
  targetPath: string;
  uID: string;
  gID: string;
  mode: number;
}

export interface SecretOperationStatus {
  operationId: string;
  action: string;
  status: 'running' | 'success' | 'failed';
  progress: number;
  logs: string[];
  error?: string;
  timestamp: string;
}

export interface ConfigOperationStatus {
  operationId: string;
  action: string;
  status: 'running' | 'success' | 'failed';
  progress: number;
  logs: string[];
  error?: string;
  timestamp: string;
}

export interface SecretUsageInfo {
  secretId: string;
  secretName: string;
  inUse: boolean;
  services: Array<{
    id: string;
    name: string;
    replicas: number;
    status: string;
    createdAt: string;
  }>;
}

export interface ConfigUsageInfo {
  configId: string;
  configName: string;
  inUse: boolean;
  services: Array<{
    id: string;
    name: string;
    replicas: number;
    status: string;
    createdAt: string;
  }>;
}

export interface SecretHistoryEntry {
  operationId: string;
  action: string;
  status: 'success' | 'failed';
  timestamp: string;
  initiator: string;
  error?: string;
}

export interface ConfigHistoryEntry {
  operationId: string;
  action: string;
  status: 'success' | 'failed';
  timestamp: string;
  initiator: string;
  error?: string;
}

export interface SecretValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SecretOperationProgress {
  operationId: string;
  status: 'running' | 'success' | 'failed';
  logs: string[];
  error?: string;
}

export interface ConfigOperationProgress {
  operationId: string;
  status: 'running' | 'success' | 'failed';
  logs: string[];
  error?: string;
}

export interface SecretsDashboardSummary {
  totalSecrets: number;
  totalConfigs: number;
  attachedSecrets: number;
  attachedConfigs: number;
  unusedSecrets: number;
  unusedConfigs: number;
  recentOperationsCount: number;
  swarmActive: boolean;
}

export interface StackInfo {
  name: string;
  servicesCount: number;
  tasksCount: number;
  createdAt: string;
  updatedAt: string;
  status: 'running' | 'degraded' | 'failed' | 'empty';
}

export interface StackServiceInfo {
  id: string;
  name: string;
  image: string;
  replicas: {
    running: number;
    desired: number;
  };
  ports: string[];
}

export interface StackTaskInfo {
  id: string;
  nodeId: string;
  state: string;
  desiredState: string;
  error?: string;
  timestamp: string;
}

export interface StackNetworkInfo {
  id: string;
  name: string;
  driver: string;
  scope: string;
}

export interface StackVolumeInfo {
  name: string;
  driver: string;
  scope: string;
}

export interface StackDeploymentRequest {
  name: string;
  content: string;
  env?: Record<string, string>;
}

export interface StackUpdateRequest {
  content: string;
}

export interface StackScaleRequest {
  serviceId: string;
  replicas: number;
}

export interface StackRemoveRequest {
  force?: boolean;
}

export interface StackInspectResponse {
  name: string;
  composeSource: string;
  services: StackServiceInfo[];
  networks: StackNetworkInfo[];
  volumes: StackVolumeInfo[];
  secrets: string[];
  configs: string[];
  status: string;
}

export interface StackOperationStatus {
  operationId: string;
  action: string;
  status: 'running' | 'success' | 'failed';
  progress: number;
  logs: string[];
  error?: string;
  timestamp: string;
}

export interface StackHistoryEntry {
  operationId: string;
  action: string;
  status: 'success' | 'failed';
  timestamp: string;
  initiator: string;
  error?: string;
}

export interface StackHealthSummary {
  status: 'healthy' | 'degraded' | 'critical';
  runningStacks: number;
  failedStacks: number;
  totalServices: number;
}

export interface StackOperationProgress {
  operationId: string;
  status: 'running' | 'success' | 'failed';
  logs: string[];
  error?: string;
}

export interface StackValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface StackDashboardSummary {
  totalStacks: number;
  runningStacks: number;
  failedStacks: number;
  totalServices: number;
  runningTasks: number;
  pendingTasks: number;
  swarmActive: boolean;
}

export interface BackupInfo {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'selective';
  createdAt: string;
  size: number;
  checksum: string;
  status: 'completed' | 'failed' | 'verifying';
  resources: {
    containers: string[];
    volumes: string[];
    images: string[];
    networks: string[];
    stacks: string[];
    secrets: string[];
    configs: string[];
  };
}

export interface BackupSchedule {
  id: string;
  name: string;
  cronExpression: string;
  target: 'full' | 'incremental' | 'selective';
  enabled: boolean;
  retentionPolicy: {
    maxBackups: number;
    maxAgeDays: number;
  };
}

export interface BackupDashboardSummary {
  totalJobs: number;
  scheduledBackups: number;
  completedArchives: number;
  failedJobs: number;
  storageUsage: number;
  protectedContainers: number;
  protectedVolumes: number;
  protectedImages: number;
  protectedStacks: number;
}

export interface BackupOperationStatus {
  operationId: string;
  action: string;
  status: 'running' | 'success' | 'failed';
  progress: number;
  logs: string[];
  error?: string;
  timestamp: string;
}

export interface BackupHistoryEntry {
  id: string;
  action: string;
  status: 'success' | 'failed';
  timestamp: string;
  error?: string;
}

export interface SecurityFinding {
  id: string;
  targetType: 'container' | 'image' | 'system';
  targetId: string;
  category: 'vulnerability' | 'compliance' | 'hardening';
  ruleId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expected?: string;
  actual?: string;
  remediation: string;
  timestamp: string;
}

export interface SecurityScanSchedule {
  id: string;
  name: string;
  cronExpression: string;
  target: 'all' | 'containers' | 'images' | 'compliance';
  enabled: boolean;
}

export interface SecurityDashboardSummary {
  complianceScore: number;
  vulnerabilityScore: number;
  scannedContainers: number;
  scannedImages: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  privilegedContainers: number;
  containersRunningAsRoot: number;
  exposedSockets: number;
  writableFilesystems: number;
}

export interface SecurityOperationStatus {
  operationId: string;
  action: string;
  status: 'running' | 'success' | 'failed';
  progress: number;
  logs: string[];
  error?: string;
  timestamp: string;
}

export interface DockerEventInfo {
  id: string;
  timestamp: string;
  resourceType: 'container' | 'image' | 'volume' | 'network' | 'stack' | 'secret' | 'config' | 'system';
  resourceId: string;
  action: string;
  status: 'success' | 'failed' | 'warning';
  severity: 'info' | 'warning' | 'error';
  originatingModule: string;
  message: string;
}

export interface AuditEventSchedule {
  id: string;
  name: string;
  cronExpression: string;
  target: 'all' | 'containers' | 'images' | 'system';
  enabled: boolean;
}

export interface EventDashboardSummary {
  totalEvents: number;
  eventsToday: number;
  warningEvents: number;
  errorEvents: number;
  activeStatus: boolean;
  storageUsage: number;
}

export interface EventOperationStatus {
  operationId: string;
  action: string;
  status: 'running' | 'success' | 'failed';
  progress: number;
  logs: string[];
  error?: string;
  timestamp: string;
}

export interface PolicyInfo {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  targetResourceType: 'container' | 'image' | 'network' | 'volume' | 'stack' | 'secret' | 'config' | 'system';
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PolicyFinding {
  id: string;
  policyId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  targetResourceType: string;
  targetResourceId: string;
  status: 'active' | 'acknowledged' | 'ignored' | 'resolved';
  justification?: string;
  timestamp: string;
  remediation: string;
}

export interface PolicyScanSchedule {
  id: string;
  name: string;
  cronExpression: string;
  target: 'all' | 'containers' | 'images' | 'system';
  enabled: boolean;
}

export interface PolicyDashboardSummary {
  totalPolicies: number;
  enabledPolicies: number;
  disabledPolicies: number;
  compliantResources: number;
  nonCompliantResources: number;
  totalViolations: number;
  criticalFindings: number;
  warningFindings: number;
  infoFindings: number;
  compliancePercentage: number;
}

export interface PolicyOperationStatus {
  operationId: string;
  action: string;
  status: 'running' | 'success' | 'failed';
  progress: number;
  logs: string[];
  error?: string;
  timestamp: string;
}

export interface DockerHostInfo {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  hostname: string;
  ipAddress: string;
  port: number;
  connectionType: 'socket' | 'tcp' | 'tls' | 'ssh' | 'wsl';
  enabled: boolean;
  status: 'online' | 'offline' | 'degraded';
  latency: number;
  lastSync: string;
  cpuCount: number;
  memory: number;
  favorite: boolean;
  archived: boolean;
}

export interface HostDashboardSummary {
  totalHosts: number;
  onlineHosts: number;
  offlineHosts: number;
  degradedHosts: number;
  avgLatency: number;
  fleetCpu: number;
  fleetMemory: number;
  fleetContainers: number;
  fleetImages: number;
  fleetVolumes: number;
  fleetNetworks: number;
}

export interface HostOperationStatus {
  operationId: string;
  action: string;
  status: 'running' | 'success' | 'failed';
  progress: number;
  logs: string[];
  error?: string;
  timestamp: string;
}








