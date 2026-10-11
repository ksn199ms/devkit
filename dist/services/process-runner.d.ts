import type { CancellationToken } from '../core/cancellation.js';
export interface ProcessRunOptions {
    cwd?: string;
    env?: Record<string, string>;
    timeoutMs?: number;
    cancellationToken?: CancellationToken;
    maxOutputBytes?: number;
}
export interface ProcessRunResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}
export declare class ProcessRunner {
    static run(executable: string, args?: string[], options?: ProcessRunOptions): Promise<ProcessRunResult>;
}
//# sourceMappingURL=process-runner.d.ts.map