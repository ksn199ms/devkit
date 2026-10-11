import type { DevKitConfig } from './config.js';
import type { Logger } from './logger.js';
import type { CancellationToken } from './cancellation.js';
export interface CommandOption {
    flags: string;
    description: string;
    defaultValue?: unknown;
}
export interface CommandArgument {
    name: string;
    description: string;
    required?: boolean;
}
export interface ExecutionContext {
    config: DevKitConfig;
    logger: Logger;
    cancellationToken: CancellationToken;
    projectRoot: string;
    args: string[];
    options: Record<string, unknown>;
    interactive: boolean;
}
export type CommandAction = (ctx: ExecutionContext) => Promise<number | void>;
export interface CommandDefinition {
    name: string;
    description: string;
    usage: string;
    aliases?: string[];
    options?: CommandOption[];
    arguments?: CommandArgument[];
    interactive: boolean;
    category: 'core' | 'ai' | 'diagnostics' | 'git';
    action: CommandAction;
}
declare class CommandRegistry {
    private readonly commands;
    register(def: CommandDefinition): void;
    get(name: string): CommandDefinition | undefined;
    getAll(): CommandDefinition[];
    getInteractiveCommands(): CommandDefinition[];
}
export declare const commandRegistry: CommandRegistry;
export {};
//# sourceMappingURL=command-registry.d.ts.map