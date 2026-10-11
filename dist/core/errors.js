export var ExitCode;
(function (ExitCode) {
    ExitCode[ExitCode["SUCCESS"] = 0] = "SUCCESS";
    ExitCode[ExitCode["GENERAL_ERROR"] = 1] = "GENERAL_ERROR";
    ExitCode[ExitCode["VALIDATION_ERROR"] = 2] = "VALIDATION_ERROR";
    ExitCode[ExitCode["FILESYSTEM_ERROR"] = 3] = "FILESYSTEM_ERROR";
    ExitCode[ExitCode["GIT_ERROR"] = 4] = "GIT_ERROR";
    ExitCode[ExitCode["AI_ERROR"] = 5] = "AI_ERROR";
    ExitCode[ExitCode["CONFIG_ERROR"] = 6] = "CONFIG_ERROR";
    ExitCode[ExitCode["PROCESS_ERROR"] = 7] = "PROCESS_ERROR";
    ExitCode[ExitCode["CANCELLATION"] = 130] = "CANCELLATION";
})(ExitCode || (ExitCode = {}));
export class DevKitError extends Error {
    code;
    exitCode;
    remediation;
    details;
    constructor(message, code = 'ERR_DEVKIT_GENERAL', exitCode = ExitCode.GENERAL_ERROR, options) {
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
    constructor(message, remediation, details) {
        super(message, 'ERR_VALIDATION', ExitCode.VALIDATION_ERROR, {
            remediation: remediation ?? 'Check command arguments and provided values.',
            details,
        });
        this.name = 'ValidationError';
    }
}
export class FileSystemError extends DevKitError {
    constructor(message, options) {
        super(message, 'ERR_FILESYSTEM', ExitCode.FILESYSTEM_ERROR, {
            remediation: options?.remediation ?? 'Verify file existence, project boundary, and read permissions.',
            details: options?.path ? { path: options.path } : undefined,
            cause: options?.cause,
        });
        this.name = 'FileSystemError';
    }
}
export class GitError extends DevKitError {
    constructor(message, remediation, cause) {
        super(message, 'ERR_GIT', ExitCode.GIT_ERROR, {
            remediation: remediation ??
                'Ensure Git is installed, on your PATH, and the target directory is a repository.',
            cause,
        });
        this.name = 'GitError';
    }
}
export class AIError extends DevKitError {
    constructor(message, options) {
        super(message, 'ERR_AI_PROVIDER', ExitCode.AI_ERROR, {
            remediation: options?.remediation ??
                'Check AI provider credentials, network connectivity, and model configuration.',
            details: { ...options?.details, provider: options?.provider },
            cause: options?.cause,
        });
        this.name = 'AIError';
    }
}
export class ConfigError extends DevKitError {
    constructor(message, remediation, details) {
        super(message, 'ERR_CONFIG', ExitCode.CONFIG_ERROR, {
            remediation: remediation ?? 'Verify configuration file syntax and schema definitions.',
            details,
        });
        this.name = 'ConfigError';
    }
}
export class ProcessExecutionError extends DevKitError {
    constructor(message, options) {
        super(message, 'ERR_PROCESS', ExitCode.PROCESS_ERROR, {
            remediation: options?.remediation ?? 'Ensure the requested command is installed and executable.',
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
export function toDevKitError(err) {
    if (err instanceof DevKitError) {
        return err;
    }
    if (err instanceof Error) {
        return new DevKitError(err.message, 'ERR_UNKNOWN', ExitCode.GENERAL_ERROR, { cause: err });
    }
    return new DevKitError(String(err), 'ERR_UNKNOWN', ExitCode.GENERAL_ERROR);
}
//# sourceMappingURL=errors.js.map