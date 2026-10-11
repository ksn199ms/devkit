export enum ExitCode {
  SUCCESS = 0,
  GENERAL_ERROR = 1,
  VALIDATION_ERROR = 2,
  FILESYSTEM_ERROR = 3,
  GIT_ERROR = 4,
  AI_ERROR = 5,
  CONFIG_ERROR = 6,
  PROCESS_ERROR = 7,
  CANCELLATION = 130,
}

export interface DevKitErrorOptions {
  cause?: unknown;
  remediation?: string;
  details?: Record<string, unknown>;
}

export class DevKitError extends Error {
  public readonly code: string;
  public readonly exitCode: ExitCode;
  public readonly remediation?: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = 'ERR_DEVKIT_GENERAL',
    exitCode: ExitCode = ExitCode.GENERAL_ERROR,
    options?: DevKitErrorOptions,
  ) {
    super(message, { cause: options?.cause });
    this.name = 'DevKitError';
    this.code = code;
    this.exitCode = exitCode;
    this.remediation = options?.remediation;
    this.details = options?.details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends DevKitError {
  constructor(message: string, remediation?: string, details?: Record<string, unknown>) {
    super(message, 'ERR_VALIDATION', ExitCode.VALIDATION_ERROR, {
      remediation: remediation ?? 'Check command arguments and provided values.',
      details,
    });
    this.name = 'ValidationError';
  }
}

export class FileSystemError extends DevKitError {
  constructor(message: string, options?: { path?: string; remediation?: string; cause?: unknown }) {
    super(message, 'ERR_FILESYSTEM', ExitCode.FILESYSTEM_ERROR, {
      remediation:
        options?.remediation ?? 'Verify file existence, project boundary, and read permissions.',
      details: options?.path ? { path: options.path } : undefined,
      cause: options?.cause,
    });
    this.name = 'FileSystemError';
  }
}

export class GitError extends DevKitError {
  constructor(message: string, remediation?: string, cause?: unknown) {
    super(message, 'ERR_GIT', ExitCode.GIT_ERROR, {
      remediation:
        remediation ??
        'Ensure Git is installed, on your PATH, and the target directory is a repository.',
      cause,
    });
    this.name = 'GitError';
  }
}

export class AIError extends DevKitError {
  constructor(
    message: string,
    options?: {
      provider?: string;
      remediation?: string;
      details?: Record<string, unknown>;
      cause?: unknown;
    },
  ) {
    super(message, 'ERR_AI_PROVIDER', ExitCode.AI_ERROR, {
      remediation:
        options?.remediation ??
        'Check AI provider credentials, network connectivity, and model configuration.',
      details: { ...options?.details, provider: options?.provider },
      cause: options?.cause,
    });
    this.name = 'AIError';
  }
}

export class ConfigError extends DevKitError {
  constructor(message: string, remediation?: string, details?: Record<string, unknown>) {
    super(message, 'ERR_CONFIG', ExitCode.CONFIG_ERROR, {
      remediation: remediation ?? 'Verify configuration file syntax and schema definitions.',
      details,
    });
    this.name = 'ConfigError';
  }
}

export class ProcessExecutionError extends DevKitError {
  constructor(
    message: string,
    options?: {
      command?: string;
      exitCode?: number;
      remediation?: string;
      cause?: unknown;
    },
  ) {
    super(message, 'ERR_PROCESS', ExitCode.PROCESS_ERROR, {
      remediation:
        options?.remediation ?? 'Ensure the requested command is installed and executable.',
      details: { command: options?.command, processExitCode: options?.exitCode },
      cause: options?.cause,
    });
    this.name = 'ProcessExecutionError';
  }
}

export class CancellationError extends DevKitError {
  constructor(message = 'Operation cancelled by user') {
    super(message, 'ERR_CANCELLED', ExitCode.CANCELLATION, {
      remediation: 'Operation was aborted before completion.',
    });
    this.name = 'CancellationError';
  }
}

export function toDevKitError(err: unknown): DevKitError {
  if (err instanceof DevKitError) {
    return err;
  }
  if (err instanceof Error) {
    return new DevKitError(err.message, 'ERR_UNKNOWN', ExitCode.GENERAL_ERROR, { cause: err });
  }
  return new DevKitError(String(err), 'ERR_UNKNOWN', ExitCode.GENERAL_ERROR);
}
