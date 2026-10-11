export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';
export interface LoggerOptions {
    level?: LogLevel;
    json?: boolean;
}
export declare function redactSecrets(text: string): string;
export declare class Logger {
    private level;
    private jsonMode;
    constructor(options?: LoggerOptions);
    setLevel(level: LogLevel): void;
    setJsonMode(enabled: boolean): void;
    private shouldLog;
    debug(...args: unknown[]): void;
    info(...args: unknown[]): void;
    success(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
    private writeJson;
    private formatArgs;
}
export declare const logger: Logger;
//# sourceMappingURL=logger.d.ts.map