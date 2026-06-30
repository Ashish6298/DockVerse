import Dockerode from 'dockerode';
import os from 'os';

export interface DockerClientOptions {
  socketPath?: string;
  host?: string;
  port?: number;
}

export function createDockerClient(options: DockerClientOptions = {}): Dockerode {
  if (options.host) {
    return new Dockerode({
      host: options.host,
      port: options.port || 2375,
    });
  }

  if (options.socketPath) {
    return new Dockerode({ socketPath: options.socketPath });
  }

  // Platform-based default detection
  const isWindows = os.platform() === 'win32';
  if (isWindows) {
    return new Dockerode({ socketPath: '//./pipe/docker_engine' });
  } else {
    return new Dockerode({ socketPath: '/var/run/docker.sock' });
  }
}

export { Dockerode };
export default createDockerClient;
