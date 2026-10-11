import { describe, it, expect } from 'vitest';
import { MockAIProvider, createAIProvider } from '../../src/ai/provider.js';
import { loadConfig } from '../../src/core/config.js';
import { CancellationTokenSource } from '../../src/core/cancellation.js';

describe('AI Provider Abstraction', () => {
  it('MockAIProvider completes and streams deterministic responses', async () => {
    const provider = new MockAIProvider();
    expect(provider.name).toBe('mock');
    expect(provider.isConfigured()).toBe(true);

    const res = await provider.complete({
      messages: [{ role: 'user', content: 'Please explain this function' }],
    });

    expect(res.text).toContain('Code Analysis Summary');

    let streamed = '';
    await provider.stream({ messages: [{ role: 'user', content: 'review changes' }] }, (chunk) => {
      streamed += chunk;
    });

    expect(streamed).toContain('Code Review Analysis');
  });

  it('respects cancellation during streaming', async () => {
    const provider = new MockAIProvider();
    const cts = new CancellationTokenSource();
    cts.cancel();

    await expect(
      provider.complete({ messages: [{ role: 'user', content: 'test' }] }, cts.token),
    ).rejects.toThrow('Operation cancelled');
  });

  it('createAIProvider falls back safely to mock when credentials absent', () => {
    const config = loadConfig(process.cwd(), { aiProvider: 'openai', aiApiKey: '' });
    const provider = createAIProvider(config);
    expect(provider.name).toBe('mock');
  });
});
