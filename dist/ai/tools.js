import { z } from 'zod';
import { FileSystemService } from '../services/filesystem.js';
import { GitService } from '../services/git.js';
import { ProcessRunner } from '../services/process-runner.js';
import { DevKitError } from '../core/errors.js';
export const ReadFileTool = {
    name: 'read_file',
    description: 'Safely read the content of a project file within permitted boundaries',
    isMutating: false,
    schema: z.object({
        filePath: z.string().min(1, 'filePath is required'),
    }),
    async execute(params, ctx) {
        const res = await FileSystemService.readFile(params.filePath, {
            projectRoot: ctx.projectRoot,
            allowExternalPaths: ctx.config.security.allowExternalPaths,
            maxFileSizeKb: ctx.config.security.maxFileSizeKb,
        });
        return { path: res.path, content: res.content, sizeBytes: res.sizeBytes };
    },
};
export const ListFilesTool = {
    name: 'list_files',
    description: 'List project files respecting ignore patterns and limits',
    isMutating: false,
    schema: z.object({
        dirPath: z.string().optional().default('.'),
        maxFiles: z.number().int().positive().max(500).optional().default(100),
    }),
    async execute(params, ctx) {
        const files = FileSystemService.listProjectFiles(params.dirPath ?? '.', {
            projectRoot: ctx.projectRoot,
            allowExternalPaths: ctx.config.security.allowExternalPaths,
            maxFiles: params.maxFiles,
        });
        return { count: files.length, files };
    },
};
export const GitStatusTool = {
    name: 'git_status',
    description: 'Inspect repository status, branch, and uncommitted changes',
    isMutating: false,
    schema: z.object({}),
    async execute(_params, ctx) {
        return await GitService.getStatus(ctx.projectRoot, ctx.cancellationToken);
    },
};
export const GitDiffTool = {
    name: 'git_diff',
    description: 'Inspect repository diffs',
    isMutating: false,
    schema: z.object({
        staged: z.boolean().optional().default(false),
        filePath: z.string().optional(),
    }),
    async execute(params, ctx) {
        const diff = await GitService.getDiff(ctx.projectRoot, {
            staged: params.staged,
            filePath: params.filePath,
            cancellationToken: ctx.cancellationToken,
        });
        return { diff: diff.slice(0, 50000) };
    },
};
// Approved diagnostic commands only (Strict allowlist - NEVER arbitrary shell execution)
const APPROVED_DIAGNOSTIC_COMMANDS = new Set([
    'git status',
    'git log -n 5 --oneline',
    'node --version',
    'npm --version',
    'npm test -- --run',
    'npm run typecheck',
]);
export const RunDiagnosticTool = {
    name: 'run_diagnostic',
    description: 'Execute an approved, read-only diagnostic command from a strict allowlist',
    isMutating: false,
    schema: z.object({
        command: z.string().refine((cmd) => APPROVED_DIAGNOSTIC_COMMANDS.has(cmd.trim()), {
            message: 'Command is not in the approved diagnostic allowlist.',
        }),
    }),
    async execute(params, ctx) {
        const parts = params.command.trim().split(/\s+/);
        const executable = parts[0];
        const args = parts.slice(1);
        const res = await ProcessRunner.run(executable, args, {
            cwd: ctx.projectRoot,
            timeoutMs: 15000,
            cancellationToken: ctx.cancellationToken,
        });
        return { exitCode: res.exitCode, stdout: res.stdout, stderr: res.stderr };
    },
};
export const ApplyPatchTool = {
    name: 'apply_patch',
    description: 'Propose and apply a modification to an existing project file (Mutating)',
    isMutating: true,
    schema: z.object({
        filePath: z.string().min(1),
        newContent: z.string(),
    }),
    async execute(params, ctx) {
        await FileSystemService.writeFileAtomic(params.filePath, params.newContent, {
            projectRoot: ctx.projectRoot,
            allowExternalPaths: ctx.config.security.allowExternalPaths,
            maxFileSizeKb: ctx.config.security.maxFileSizeKb,
        });
        return { success: true, updatedPath: params.filePath };
    },
};
export const availableTools = [
    ReadFileTool,
    ListFilesTool,
    GitStatusTool,
    GitDiffTool,
    RunDiagnosticTool,
    ApplyPatchTool,
];
export function findTool(name) {
    return availableTools.find((t) => t.name === name);
}
export async function executeToolSafely(toolName, rawArgs, ctx) {
    const tool = findTool(toolName);
    if (!tool) {
        return { success: false, error: `Tool "${toolName}" is not recognized.` };
    }
    const parsed = tool.schema.safeParse(rawArgs);
    if (!parsed.success) {
        return {
            success: false,
            error: `Validation error for "${toolName}": ${parsed.error.issues.map((i) => i.message).join(', ')}`,
        };
    }
    try {
        const result = await tool.execute(parsed.data, ctx);
        return { success: true, result };
    }
    catch (err) {
        const msg = err instanceof DevKitError ? err.message : err.message;
        return { success: false, error: msg };
    }
}
//# sourceMappingURL=tools.js.map