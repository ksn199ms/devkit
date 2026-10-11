import { describe, it, expect } from 'vitest';
import { redactSecrets } from '../../src/core/logger.js';

describe('Logger and Secret Redaction', () => {
  it('redacts sensitive API keys and tokens', () => {
    const openaiKey = 'sk-1234567890abcdef1234567890abcdef';
    expect(redactSecrets(`Using key ${openaiKey} for requests`)).toBe(
      'Using key [REDACTED] for requests',
    );

    const anthropicKey = 'sk-ant-api03-abcdef1234567890abcdef1234567890';
    expect(redactSecrets(`Anthropic key: ${anthropicKey}`)).toBe('Anthropic key: [REDACTED]');

    const bearerToken = 'Authorization: Bearer my-super-secret-token.123';
    expect(redactSecrets(bearerToken)).toBe('Authorization: Bearer [REDACTED]');

    const passAssignment = 'password="MySuperSecretPassword!"';
    expect(redactSecrets(passAssignment)).toBe('password=[REDACTED]');
  });

  it('preserves ordinary non-sensitive text', () => {
    const normal = 'Compiling TypeScript project in d:/DevKit... Completed in 1.2s';
    expect(redactSecrets(normal)).toBe(normal);
  });
});
