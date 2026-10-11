import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { runCli } from '../../src/cli.js';
import { ExitCode } from '../../src/core/errors.js';

describe('CLI Integration Tests', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env['DEVKIT_AI_PROVIDER'] = 'mock';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });
  it('runs doctor command returning exit code 0', async () => {
    const code = await runCli(['node', 'devkit', 'doctor']);
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('runs init command returning exit code 0', async () => {
    const code = await runCli(['node', 'devkit', 'init']);
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('runs explain command on valid file returning exit code 0', async () => {
    const code = await runCli(['node', 'devkit', 'explain', 'package.json']);
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('runs explain on path outside boundary returning FILESYSTEM_ERROR exit code', async () => {
    const code = await runCli(['node', 'devkit', 'explain', '../../outside.txt']);
    expect(code).toBe(ExitCode.FILESYSTEM_ERROR);
  });

  it('runs chat with single message returning exit code 0', async () => {
    const code = await runCli(['node', 'devkit', 'chat', '--message', 'Hello from automated test']);
    expect(code).toBe(ExitCode.SUCCESS);
  });
});
