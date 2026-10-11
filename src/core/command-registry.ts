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

class CommandRegistry {
  private readonly commands = new Map<string, CommandDefinition>();

  public register(def: CommandDefinition): void {
    if (this.commands.has(def.name)) {
      throw new Error(`Command "${def.name}" is already registered.`);
    }
    this.commands.set(def.name, def);
  }

  public get(name: string): CommandDefinition | undefined {
    return (
      this.commands.get(name) ||
      Array.from(this.commands.values()).find((cmd) => cmd.aliases?.includes(name))
    );
  }

  public getAll(): CommandDefinition[] {
    return Array.from(this.commands.values());
  }

  public getInteractiveCommands(): CommandDefinition[] {
    return this.getAll().filter((cmd) => cmd.interactive);
  }
}

export const commandRegistry = new CommandRegistry();
