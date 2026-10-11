import type { CancellationToken } from '../core/cancellation.js';
export interface GitFileStatus {
    path: string;
    indexStatus: string;
    workingTreeStatus: string;
    staged: boolean;
}
export interface GitRepoStatus {
    isRepo: boolean;
    branch?: string;
    commit?: string;
    files: GitFileStatus[];
    stagedCount: number;
    unstagedCount: number;
    untrackedCount: number;
}
export declare class GitService {
    static isGitAvailable(cancellationToken?: CancellationToken): Promise<boolean>;
    static isRepository(cwd: string, cancellationToken?: CancellationToken): Promise<boolean>;
    static getStatus(cwd: string, cancellationToken?: CancellationToken): Promise<GitRepoStatus>;
    static getDiff(cwd: string, options?: {
        staged?: boolean;
        filePath?: string;
        maxBytes?: number;
        cancellationToken?: CancellationToken;
    }): Promise<string>;
}
//# sourceMappingURL=git.d.ts.map