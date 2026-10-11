import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { loadConfig, getRedactedConfig } from '../../src/core/config.js';

describe('Configuration Precedence and Validation', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env['DEVKIT_AI_API_KEY'];
    delete process.env['DEVKIT_AI_PROVIDER'];
    delete process.env['DEVKIT_AI_MODEL'];
    delete process.env['DEVKIT_MAX_FILE_SIZE_KB'];
    delete process.env['GEMINI_API_KEY'];
    delete process.env['OPENAI_API_KEY'];
    delete process.env['ANTHROPIC_API_KEY'];
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('loads valid default configuration', () => {
    const config = loadConfig(process.cwd());
    expect(config.appName).toBe('devkit');
    expect(config.ai.provider).toBe('gemini');
    expect(config.security.redactSecrets).toBe(true);
    expect(config.security.maxFileSizeKb).toBe(512);
  });

  it('prioritizes environment variables over defaults', () => {
    process.env['DEVKIT_AI_PROVIDER'] = 'openai';
    process.env['DEVKIT_AI_API_KEY'] = 'test-secret-key';
    process.env['DEVKIT_MAX_FILE_SIZE_KB'] = '1024';

    const config = loadConfig(process.cwd());
    expect(config.ai.provider).toBe('openai');
    expect(config.ai.apiKey).toBe('test-secret-key');
    expect(config.security.maxFileSizeKb).toBe(1024);
  });

  it('prioritizes CLI overrides over environment variables', () => {
    process.env['DEVKIT_AI_PROVIDER'] = 'openai';

    const config = loadConfig(process.cwd(), {
      aiProvider: 'anthropic',
      maxFileSizeKb: 2048,
    });

    expect(config.ai.provider).toBe('anthropic');
    expect(config.security.maxFileSizeKb).toBe(2048);
  });

  it('redacts sensitive credentials when inspecting config', () => {
    const config = loadConfig(process.cwd(), {
      aiApiKey: 'super-secret-api-token',
    });

    const safe = getRedactedConfig(config) as { ai: { apiKey: string } };
    expect(safe.ai.apiKey).toBe('[REDACTED]');
  });

  it('reads GEMINI_API_KEY from project .env file when process.env is unset', () => {
    const tempDir = path.join(process.cwd(), '.test-env-temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(path.join(tempDir, '.env'), 'GEMINI_API_KEY=test-from-dotenv-file\n', 'utf-8');

    try {
      const config = loadConfig(tempDir);
      expect(config.ai.provider).toBe('gemini');
      expect(config.ai.apiKey).toBe('test-from-dotenv-file');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
