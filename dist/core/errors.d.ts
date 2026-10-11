export declare enum ExitCode {
    SUCCESS = 0,
    GENERAL_ERROR = 1,
    VALIDATION_ERROR = 2,
    FILESYSTEM_ERROR = 3,
    GIT_ERROR = 4,
    AI_ERROR = 5,
    CONFIG_ERROR = 6,
    PROCESS_ERROR = 7,
    CANCELLATION = 130
}
export interface DevKitErrorOptions {
    cause?: unknown;
    remediation?: string;
    details?: Record<string, unknown>;
}
export declare class DevKitError extends Error {
    readonly code: string;
    readonly exitCode: ExitCode;
    readonly remediation?: string;
    readonly details?: Record<string, unknown>;
    constructor(message: string, code?: string, exitCode?: ExitCode, options?: DevKitErrorOptions);
}
export declare class ValidationError extends DevKitError {
    constructor(message: string, remediation?: string, details?: Record<string, unknown>);
}
export declare class FileSystemError extends DevKitError {
    constructor(message: string, options?: {
        path?: string;
        remediation?: string;
        cause?: unknown;
    });
}
export declare class GitError extends DevKitError {
    constructor(message: string, remediation?: string, cause?: unknown);
}
export declare class AIError extends DevKitError {
    constructor(message: string, options?: {
        provider?: string;
        remediation?: string;
        details?: Record<string, unknown>;
        cause?: unknown;
    });
}
export declare class ConfigError extends DevKitError {
    constructor(message: string, remediation?: string, details?: Record<string, unknown>);
}
export declare class ProcessExecutionError extends DevKitError {
    constructor(message: string, options?: {
        command?: string;
        exitCode?: number;
        remediation?: string;
        cause?: unknown;
    });
}
export declare class CancellationError extends DevKitError {
    constructor(message?: string);
}
export declare function toDevKitError(err: unknown): DevKitError;
//# sourceMappingURL=errors.d.ts.map