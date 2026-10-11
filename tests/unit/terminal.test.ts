import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  stripAnsi,
  truncate,
  detectTerminalCapabilities,
  resetTerminalCapabilitiesCache,
} from '../../src/core/terminal.js';

describe('Terminal Formatting and Capabilities', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetTerminalCapabilitiesCache();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetTerminalCapabilitiesCache();
  });

  it('strips ANSI escape codes reliably', () => {
    const ansiString = '\u001b[31mRed Alert\u001b[39m';
    expect(stripAnsi(ansiString)).toBe('Red Alert');
  });

  it('truncates strings exceeding max length', () => {
    expect(truncate('Hello World', 5)).toBe('He...');
    expect(truncate('Short', 10)).toBe('Short');
  });

  it('respects NO_COLOR convention', () => {
    process.env['NO_COLOR'] = '1';
    delete process.env['FORCE_COLOR'];
    const caps = detectTerminalCapabilities();
    expect(caps.supportsColor).toBe(false);
  });

  it('respects FORCE_COLOR convention', () => {
    process.env['FORCE_COLOR'] = '1';
    delete process.env['NO_COLOR'];
    const caps = detectTerminalCapabilities();
    expect(caps.supportsColor).toBe(true);
  });

  it('renders markdown cleanly without raw symbols', async () => {
    const { renderMarkdown } = await import('../../src/core/terminal.js');
    const input = [
      '### 1. Core Framework',
      '* **next** (`16.0.1`): Next.js app',
      '---',
      '```ts',
      'const x = 1;',
      '```',
    ].join('\n');

    const formatted = renderMarkdown(input);
    const plain = stripAnsi(formatted);

    // Should not contain raw markdown markers
    expect(plain).not.toContain('###');
    expect(plain).not.toContain('**next**');
    expect(plain).not.toContain('`16.0.1`');
    expect(plain).toContain('1. Core Framework');
    expect(plain).toContain('next (16.0.1): Next.js app');
    expect(plain).toContain('const x = 1;');
  });

  it('initializes and stops TerminalSpinner safely', async () => {
    const { TerminalSpinner } = await import('../../src/core/terminal.js');
    const spinner = new TerminalSpinner('Testing...');
    expect(() => {
      spinner.start();
      spinner.update('Updated...');
      spinner.stop();
    }).not.toThrow();
  });
});
