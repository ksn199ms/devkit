export interface TerminalCapabilities {
  supportsColor: boolean;
  isTTY: boolean;
  width: number;
  isUnicodeSupported: boolean;
}

export function detectTerminalCapabilities(): TerminalCapabilities {
  const isTTY = Boolean(process.stdout && process.stdout.isTTY);
  const noColor = process.env['NO_COLOR'] !== undefined && process.env['NO_COLOR'] !== '';
  const forceColor = process.env['FORCE_COLOR'];
  const hasForceColor = forceColor !== undefined && forceColor !== '0' && forceColor !== 'false';

  let supportsColor = false;
  if (hasForceColor) {
    supportsColor = true;
  } else if (!noColor && isTTY) {
    supportsColor = true;
  }

  const width = process.stdout && process.stdout.columns ? process.stdout.columns : 80;

  // Unicode support heuristic
  const isUnicodeSupported =
    process.platform !== 'win32' ||
    Boolean(process.env['WT_SESSION']) || // Windows Terminal
    Boolean(process.env['TERMINUS_SUBLIME']) ||
    process.env['ConEmuTask'] === '{cmd::Cmder}' ||
    process.env['TERM_PROGRAM'] === 'vscode';

  return {
    supportsColor,
    isTTY,
    width,
    isUnicodeSupported,
  };
}

let cachedCaps: TerminalCapabilities | null = null;
export function getTerminalCapabilities(): TerminalCapabilities {
  if (!cachedCaps) {
    cachedCaps = detectTerminalCapabilities();
  }
  return cachedCaps;
}

export function resetTerminalCapabilitiesCache(): void {
  cachedCaps = null;
}

function wrap(code: number, close: number, text: string): string {
  if (!getTerminalCapabilities().supportsColor) {
    return text;
  }
  return `\x1b[${code}m${text}\x1b[${close}m`;
}

export const colors = {
  bold: (text: string) => wrap(1, 22, text),
  dim: (text: string) => wrap(2, 22, text),
  italic: (text: string) => wrap(3, 23, text),
  underline: (text: string) => wrap(4, 24, text),
  red: (text: string) => wrap(31, 39, text),
  green: (text: string) => wrap(32, 39, text),
  yellow: (text: string) => wrap(33, 39, text),
  blue: (text: string) => wrap(34, 39, text),
  magenta: (text: string) => wrap(35, 39, text),
  cyan: (text: string) => wrap(36, 39, text),
  gray: (text: string) => wrap(90, 39, text),
};

export const symbols = {
  get check(): string {
    return getTerminalCapabilities().isUnicodeSupported ? '✓' : '[OK]';
  },
  get cross(): string {
    return getTerminalCapabilities().isUnicodeSupported ? '✗' : '[FAIL]';
  },
  get warning(): string {
    return getTerminalCapabilities().isUnicodeSupported ? '⚠' : '[WARN]';
  },
  get info(): string {
    return getTerminalCapabilities().isUnicodeSupported ? 'ℹ' : '[INFO]';
  },
  get bullet(): string {
    return getTerminalCapabilities().isUnicodeSupported ? '•' : '*';
  },
  get arrow(): string {
    return getTerminalCapabilities().isUnicodeSupported ? '→' : '->';
  },
};

const ANSI_REGEX = new RegExp(
  '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
  'g',
);

export function stripAnsi(text: string): string {
  return text.replace(ANSI_REGEX, '');
}

export function truncate(text: string, maxLength: number): string {
  const plain = stripAnsi(text);
  if (plain.length <= maxLength) return text;
  return plain.slice(0, Math.max(0, maxLength - 3)) + '...';
}

export class TerminalSpinner {
  private text: string;
  private intervalId: NodeJS.Timeout | null = null;
  private frameIndex = 0;
  private isSpinning = false;
  private readonly frames: string[];

  constructor(text: string = 'Thinking...') {
    this.text = text;
    const caps = getTerminalCapabilities();
    this.frames = caps.isUnicodeSupported
      ? ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
      : ['-', '\\', '|', '/'];
  }

  public start(text?: string): this {
    if (text) this.text = text;
    if (this.isSpinning) return this;

    const caps = getTerminalCapabilities();
    if (!caps.isTTY || process.env['CI']) {
      return this;
    }

    this.isSpinning = true;
    process.stdout.write('\x1b[?25l'); // Hide cursor

    const render = () => {
      const frame = colors.cyan(this.frames[this.frameIndex % this.frames.length]!);
      this.frameIndex++;
      process.stdout.write(`\r${frame} ${colors.dim(this.text)} `);
    };

    render();
    this.intervalId = setInterval(render, 80);

    return this;
  }

  public update(text: string): this {
    this.text = text;
    return this;
  }

  public stop(clear = true): this {
    if (!this.isSpinning) return this;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isSpinning = false;

    const caps = getTerminalCapabilities();
    if (caps.isTTY && !process.env['CI']) {
      if (clear) {
        process.stdout.write('\r\x1b[2K'); // Clear spinner line
      } else {
        process.stdout.write('\n');
      }
      process.stdout.write('\x1b[?25h'); // Restore cursor
    }

    return this;
  }
}

export function renderMarkdown(markdown: string): string {
  if (!markdown) return '';
  const caps = getTerminalCapabilities();
  const lines = markdown.split('\n');
  const result: string[] = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines: string[] = [];

  const formatInline = (text: string): string => {
    // Handle inline code: `code`
    let formatted = text.replace(/`([^`]+)`/g, (_, code) => {
      return caps.supportsColor ? colors.cyan(code) : code;
    });

    // Handle bold: **text** or __text__
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, (_, b) => {
      return caps.supportsColor ? colors.bold(b) : b;
    });
    formatted = formatted.replace(/__([^_]+)__/g, (_, b) => {
      return caps.supportsColor ? colors.bold(b) : b;
    });

    // Handle italic: *text* (when not a list bullet)
    formatted = formatted.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, (_, prefix, i) => {
      return `${prefix}${caps.supportsColor ? colors.italic(i) : i}`;
    });

    return formatted;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]!;

    // Code block toggle: ```lang
    const codeMatch = rawLine.match(/^```(\w+)?/);
    if (codeMatch) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = codeMatch[1] || '';
        codeBlockLines = [];
      } else {
        inCodeBlock = false;
        const borderChar = caps.isUnicodeSupported ? '│' : '|';
        const topChar = caps.isUnicodeSupported ? '┌─' : '---';
        const botChar = caps.isUnicodeSupported ? '└─' : '---';
        const langTag = codeBlockLang ? ` [${codeBlockLang}] ` : ' ';
        result.push(colors.dim(`  ${topChar}${langTag}────────────────────────────────────────`));
        for (const cLine of codeBlockLines) {
          result.push(`  ${colors.dim(borderChar)} ${colors.cyan(cLine)}`);
        }
        result.push(colors.dim(`  ${botChar}──────────────────────────────────────────`));
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    // Horizontal Rule: --- or *** or ___
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(rawLine.trim())) {
      const hr = caps.isUnicodeSupported
        ? '  ────────────────────────────────────────'
        : '  ----------------------------------------';
      result.push(colors.dim(hr));
      continue;
    }

    // Headings: strip #, ##, ### and apply styled emphasis
    const h1Match = rawLine.match(/^#\s+(.+)$/);
    if (h1Match) {
      const heading = formatInline(h1Match[1]!);
      result.push(`\n${colors.bold(colors.cyan(heading))}`);
      continue;
    }

    const h2Match = rawLine.match(/^##\s+(.+)$/);
    if (h2Match) {
      const heading = formatInline(h2Match[1]!);
      result.push(`\n${colors.bold(colors.blue(heading))}`);
      continue;
    }

    const h3Match = rawLine.match(/^###\s+(.+)$/);
    if (h3Match) {
      const heading = formatInline(h3Match[1]!);
      result.push(`\n${colors.bold(heading)}`);
      continue;
    }

    const h4Match = rawLine.match(/^####+\s+(.+)$/);
    if (h4Match) {
      const heading = formatInline(h4Match[1]!);
      result.push(`\n${colors.bold(colors.dim(heading))}`);
      continue;
    }

    // Blockquotes: > quote
    const bqMatch = rawLine.match(/^>\s*(.+)$/);
    if (bqMatch) {
      const quote = formatInline(bqMatch[1]!);
      const pipe = caps.isUnicodeSupported ? '│' : '|';
      result.push(`  ${colors.dim(pipe)} ${colors.italic(quote)}`);
      continue;
    }

    // Unordered List items (* item or - item): strip * or - and replace with clean bullet
    const bulletMatch = rawLine.match(/^(\s*)[*-]\s+(.+)$/);
    if (bulletMatch) {
      const indent = bulletMatch[1] || '';
      const content = formatInline(bulletMatch[2]!);
      result.push(`${indent}  ${symbols.bullet} ${content}`);
      continue;
    }

    // Ordered List items (1. item, 2. item)
    const numListMatch = rawLine.match(/^(\s*)(\d+\.)\s+(.+)$/);
    if (numListMatch) {
      const indent = numListMatch[1] || '';
      const num = numListMatch[2]!;
      const content = formatInline(numListMatch[3]!);
      result.push(`${indent}  ${colors.cyan(num)} ${content}`);
      continue;
    }

    // Regular line with inline formatting
    result.push(formatInline(rawLine));
  }

  return result.join('\n');
}
