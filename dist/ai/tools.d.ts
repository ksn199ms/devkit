import { z } from 'zod';
import type { DevKitConfig } from '../core/config.js';
import type { CancellationToken } from '../core/cancellation.js';
export interface ToolExecutionContext {
    projectRoot: string;
    config: DevKitConfig;
    cancellationToken?: CancellationToken;
}
export interface ToolDefinition<TParams = unknown> {
    name: string;
    description: string;
    isMutating: boolean;
    schema: z.ZodType<TParams>;
    execute(params: TParams, ctx: ToolExecutionContext): Promise<unknown>;
}
export declare const ReadFileTool: ToolDefinition<{
    filePath: string;
}>;
export declare const ListFilesTool: ToolDefinition<{
    dirPath?: string;
    maxFiles?: number;
}>;
export declare const GitStatusTool: ToolDefinition<Record<string, never>>;
export declare const GitDiffTool: ToolDefinition<{
    staged?: boolean;
    filePath?: string;
}>;
export declare const RunDiagnosticTool: ToolDefinition<{
    command: string;
}>;
export declare const ApplyPatchTool: ToolDefinition<{
    filePath: string;
    newContent: string;
}>;
export declare const availableTools: ToolDefinition[];
export declare function findTool(name: string): ToolDefinition | undefined;
export declare function executeToolSafely(toolName: string, rawArgs: unknown, ctx: ToolExecutionContext): Promise<{
    success: boolean;
    result?: unknown;
    error?: string;
}>;
//# sourceMappingURL=tools.d.ts.map