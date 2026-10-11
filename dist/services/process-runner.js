import { spawn } from 'node:child_process';
import { ProcessExecutionError } from '../core/errors.js';
import path from 'node:path';
import fs from 'node:fs';
function resolveExecutable(cmd) {
    if (process.platform !== 'win32')
        return cmd;
    if (cmd.includes('/') || cmd.includes('\\'))
        return cmd;
    const ext = path.extname(cmd).toLowerCase();
    if (ext === '.exe' || ext === '.cmd' || ext === '.bat')
        return cmd;
    const pathEnv = process.env['PATH'] || process.env['Path'] || process.env['path'] || '';
    const pathDirs = pathEnv.split(path.delimiter);
    const extensions = ['.cmd', '.exe', '.bat'];
    for (const dir of pathDirs) {
        for (const extension of extensions) {
            const full = path.join(dir, `${cmd}${extension}`);
            if (fs.existsSync(full)) {
                return full;
            }
        }
    }
    return cmd;
}
export class ProcessRunner {
    static async run(executable, args = [], options = {}) {
        const cwd = options.cwd ?? process.cwd();
        const timeoutMs = options.timeoutMs ?? 30000;
        const maxOutputBytes = options.maxOutputBytes ?? 1024 * 1024 * 5; // 5MB limit
        const targetExecutable = resolveExecutable(executable);
        return new Promise((resolve, reject) => {
            let stdoutBuffer = '';
            let stderrBuffer = '';
            let isSettled = false;
            let timer = null;
            let unsubscribeCancellation = null;
            // Filter and sanitize environment variables to avoid leaking secrets
            const safeEnv = { ...process.env, ...options.env };
            const isBatch = process.platform === 'win32' &&
                (targetExecutable.toLowerCase().endsWith('.cmd') ||
                    targetExecutable.toLowerCase().endsWith('.bat'));
            const spawnTarget = isBatch && targetExecutable.includes(' ') && !targetExecutable.startsWith('"')
                ? `"${targetExecutable}"`
                : targetExecutable;
            let child;
            try {
                child = spawn(spawnTarget, args, {
                    cwd,
                    env: safeEnv,
                    shell: isBatch,
                    windowsHide: true,
                });
            }
            catch (err) {
                return reject(new ProcessExecutionError(`Failed to spawn process "${targetExecutable}": ${err.message}`, { command: `${executable} ${args.join(' ')}`, cause: err }));
            }
            const terminateChild = () => {
                if (!child.pid || child.killed)
                    return;
                if (process.platform === 'win32') {
                    // On Windows, taskkill terminates child process trees reliably
                    try {
                        spawn('taskkill', ['/pid', child.pid.toString(), '/t', '/f'], {
                            windowsHide: true,
                            shell: false,
                        });
                    }
                    catch {
                        child.kill('SIGTERM');
                    }
                }
                else {
                    child.kill('SIGTERM');
                    setTimeout(() => {
                        if (!child.killed)
                            child.kill('SIGKILL');
                    }, 1000).unref();
                }
            };
            if (options.cancellationToken) {
                unsubscribeCancellation = options.cancellationToken.onCancellationRequested(() => {
                    if (!isSettled) {
                        isSettled = true;
                        terminateChild();
                        reject(new ProcessExecutionError(`Process "${executable}" was cancelled.`, {
                            command: `${executable} ${args.join(' ')}`,
                        }));
                    }
                });
            }
            if (timeoutMs > 0) {
                timer = setTimeout(() => {
                    if (!isSettled) {
                        isSettled = true;
                        terminateChild();
                        reject(new ProcessExecutionError(`Process "${executable}" timed out after ${timeoutMs}ms.`, {
                            command: `${executable} ${args.join(' ')}`,
                            remediation: 'Check for network delays or long-running commands.',
                        }));
                    }
                }, timeoutMs);
            }
            child.stdout?.on('data', (chunk) => {
                if (stdoutBuffer.length < maxOutputBytes) {
                    stdoutBuffer += chunk.toString('utf-8');
                    if (stdoutBuffer.length >= maxOutputBytes) {
                        stdoutBuffer += '\n[Output truncated due to size limit]';
                    }
                }
            });
            child.stderr?.on('data', (chunk) => {
                if (stderrBuffer.length < maxOutputBytes) {
                    stderrBuffer += chunk.toString('utf-8');
                    if (stderrBuffer.length >= maxOutputBytes) {
                        stderrBuffer += '\n[Error output truncated due to size limit]';
                    }
                }
            });
            child.on('error', (err) => {
                if (isSettled)
                    return;
                isSettled = true;
                if (timer)
                    clearTimeout(timer);
                if (unsubscribeCancellation)
                    unsubscribeCancellation();
                reject(new ProcessExecutionError(`Process execution failed for "${executable}": ${err.message}`, { command: `${executable} ${args.join(' ')}`, cause: err }));
            });
            child.on('close', (code) => {
                if (isSettled)
                    return;
                isSettled = true;
                if (timer)
                    clearTimeout(timer);
                if (unsubscribeCancellation)
                    unsubscribeCancellation();
                resolve({
                    stdout: stdoutBuffer,
                    stderr: stderrBuffer,
                    exitCode: code ?? 0,
                });
            });
        });
    }
}
//# sourceMappingURL=process-runner.js.map