/**
 * Base Application Error Class
 */
export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(message: string, status: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when the backend fails to connect to the Docker daemon
 */
export class DockerConnectionError extends AppError {
  constructor(message: string = 'Docker daemon is not running or unreachable') {
    super(message, 503, 'DOCKER_CONNECTION_ERROR');
  }
}

/**
 * Thrown when the backend encounters permission issues accessing the Docker socket
 */
export class DockerPermissionError extends AppError {
  constructor(message: string = 'Permission denied accessing Docker socket') {
    super(message, 403, 'DOCKER_PERMISSION_ERROR');
  }
}

/**
 * Thrown when request payload validation fails
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

/**
 * Thrown when a resource is not found
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

/**
 * Thrown for unexpected internal failures
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}
