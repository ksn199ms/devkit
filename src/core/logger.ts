import { colors, symbols } from './terminal.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export interface LoggerOptions {
  level?: LogLevel;
  json?: boolean;
}

export function redactSecrets(text: string): string {
  let redacted = text;
  // Direct token replacements
  redacted = redacted.replace(/sk-[a-zA-Z0-9_-]{20,}/g, '[REDACTED]');
  redacted = redacted.replace(/sk-ant-[a-zA-Z0-9_-]{20,}/g, '[REDACTED]');
  redacted = redacted.replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED]');
  // Bearer tokens
  redacted = redacted.replace(/(Bearer\s+)[a-zA-Z0-9_\-.]+/gi, '$1[REDACTED]');
  // Key=value patterns
  redacted = redacted.replace(
    /((?:api[_-]?key|secret|token|password)\s*[:=]\s*)["']?[^"',\s]+["']?/gi,
    '$1[REDACTED]',
  );
  return redacted;
}

export class Logger {
  private level: LogLevel = 'info';
  private jsonMode = false;

  constructor(options?: LoggerOptions) {
    if (options?.level) this.level = options.level;
    if (options?.json !== undefined) this.jsonMode = options.json;
  }

  public setLevel(level: LogLevel): void {
    this.level = level;
  }

  public setJsonMode(enabled: boolean): void {
    this.jsonMode = enabled;
  }

  private shouldLog(targetLevel: LogLevel): boolean {
    const priority: Record<LogLevel, number> = {
      debug: 10,
      info: 20,
      warn: 30,
      error: 40,
      silent: 50,
    };
    return priority[targetLevel] >= priority[this.level];
  }

  public debug(...args: unknown[]): void {
    if (!this.shouldLog('debug')) return;
    const msg = this.formatArgs(args);
    if (this.jsonMode) {
      this.writeJson('debug', msg);
    } else {
      process.stderr.write(`${colors.gray('[debug]')} ${msg}\n`);
    }
  }

  public info(...args: unknown[]): void {
    if (!this.shouldLog('info')) return;
    const msg = this.formatArgs(args);
    if (this.jsonMode) {
      this.writeJson('info', msg);
    } else {
      process.stdout.write(`${msg}\n`);
    }
  }

  public success(...args: unknown[]): void {
    if (!this.shouldLog('info')) return;
    const msg = this.formatArgs(args);
    if (this.jsonMode) {
      this.writeJson('success', msg);
    } else {
      process.stdout.write(`${colors.green(symbols.check)} ${msg}\n`);
    }
  }

  public warn(...args: unknown[]): void {
    if (!this.shouldLog('warn')) return;
    const msg = this.formatArgs(args);
    if (this.jsonMode) {
      this.writeJson('warn', msg);
    } else {
      process.stderr.write(`${colors.yellow(symbols.warning)} ${msg}\n`);
    }
  }

  public error(...args: unknown[]): void {
    if (!this.shouldLog('error')) return;
    const msg = this.formatArgs(args);
    if (this.jsonMode) {
      this.writeJson('error', msg);
    } else {
      process.stderr.write(`${colors.red(symbols.cross)} ${msg}\n`);
    }
  }

  private writeJson(level: string, message: string): void {
    const payload = JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
    });
    process.stdout.write(redactSecrets(payload) + '\n');
  }

  private formatArgs(args: unknown[]): string {
    const text = args
      .map((arg) => {
        if (typeof arg === 'string') return arg;
        if (arg instanceof Error) return arg.message;
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      })
      .join(' ');
    return redactSecrets(text);
  }
}

export const logger = new Logger();
