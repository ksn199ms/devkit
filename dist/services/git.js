import { ProcessRunner } from './process-runner.js';
import { GitError } from '../core/errors.js';
export class GitService {
    static async isGitAvailable(cancellationToken) {
        try {
            const res = await ProcessRunner.run('git', ['--version'], {
                timeoutMs: 3000,
                cancellationToken,
            });
            return res.exitCode === 0;
        }
        catch {
            return false;
        }
    }
    static async isRepository(cwd, cancellationToken) {
        try {
            const res = await ProcessRunner.run('git', ['rev-parse', '--is-inside-work-tree'], {
                cwd,
                timeoutMs: 3000,
                cancellationToken,
            });
            return res.exitCode === 0 && res.stdout.trim() === 'true';
        }
        catch {
            return false;
        }
    }
    static async getStatus(cwd, cancellationToken) {
        const isAvailable = await this.isGitAvailable(cancellationToken);
        if (!isAvailable) {
            throw new GitError('Git executable is not available on PATH.', 'Install Git and make sure "git" is accessible from your terminal.');
        }
        const isRepo = await this.isRepository(cwd, cancellationToken);
        if (!isRepo) {
            return {
                isRepo: false,
                files: [],
                stagedCount: 0,
                unstagedCount: 0,
                untrackedCount: 0,
            };
        }
        try {
            const [branchRes, statusRes, commitRes] = await Promise.all([
                ProcessRunner.run('git', ['branch', '--show-current'], { cwd, cancellationToken }),
                ProcessRunner.run('git', ['status', '--porcelain=v1'], { cwd, cancellationToken }),
                ProcessRunner.run('git', ['rev-parse', '--short', 'HEAD'], {
                    cwd,
                    cancellationToken,
                }).catch(() => ({ stdout: 'initial', stderr: '', exitCode: 0 })),
            ]);
            const branch = branchRes.stdout.trim() || 'detached';
            const commit = commitRes.stdout.trim() || undefined;
            const lines = statusRes.stdout.split('\n').filter((l) => l.trim().length > 0);
            const files = [];
            let stagedCount = 0;
            let unstagedCount = 0;
            let untrackedCount = 0;
            for (const line of lines) {
                if (line.length < 3)
                    continue;
                const x = line[0] ?? ' ';
                const y = line[1] ?? ' ';
                const filePath = line.substring(3).trim();
                const isStaged = x !== ' ' && x !== '?';
                if (isStaged)
                    stagedCount++;
                if (y !== ' ' && y !== '?')
                    unstagedCount++;
                if (x === '?' && y === '?')
                    untrackedCount++;
                files.push({
                    path: filePath,
                    indexStatus: x,
                    workingTreeStatus: y,
                    staged: isStaged,
                });
            }
            return {
                isRepo: true,
                branch,
                commit,
                files,
                stagedCount,
                unstagedCount,
                untrackedCount,
            };
        }
        catch (err) {
            throw new GitError(`Failed to retrieve git status: ${err.message}`, undefined, err);
        }
    }
    static async getDiff(cwd, options) {
        const isRepo = await this.isRepository(cwd, options?.cancellationToken);
        if (!isRepo) {
            throw new GitError('Current directory is not a Git repository.', 'Navigate to a git repository or run "git init".');
        }
        const args = ['diff', '--no-color'];
        if (options?.staged) {
            args.push('--staged');
        }
        if (options?.filePath) {
            args.push('--', options.filePath);
        }
        const maxBytes = options?.maxBytes ?? 1024 * 512; // 512 KB
        const res = await ProcessRunner.run('git', args, {
            cwd,
            maxOutputBytes: maxBytes,
            cancellationToken: options?.cancellationToken,
        });
        if (res.exitCode !== 0) {
            throw new GitError(`Git diff command failed: ${res.stderr.trim()}`);
        }
        return res.stdout;
    }
}
//# sourceMappingURL=git.js.map