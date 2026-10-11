import { describe, it, expect } from 'vitest';
import { CancellationTokenSource } from '../../src/core/cancellation.js';

describe('CancellationToken', () => {
  it('signals cancellation properly', () => {
    const cts = new CancellationTokenSource();
    expect(cts.token.isCancellationRequested).toBe(false);

    let called = false;
    cts.token.onCancellationRequested(() => {
      called = true;
    });

    cts.cancel();
    expect(cts.token.isCancellationRequested).toBe(true);
    expect(called).toBe(true);

    // Further cancel calls are idempotent
    cts.cancel();
    expect(cts.token.isCancellationRequested).toBe(true);
  });

  it('immediately triggers listeners registered after cancellation', () => {
    const cts = new CancellationTokenSource();
    cts.cancel();

    let called = false;
    cts.token.onCancellationRequested(() => {
      called = true;
    });

    expect(called).toBe(true);
  });

  it('unsubscribes listeners cleanly', () => {
    const cts = new CancellationTokenSource();
    let count = 0;
    const unsubscribe = cts.token.onCancellationRequested(() => {
      count++;
    });

    unsubscribe();
    cts.cancel();
    expect(count).toBe(0);
  });

  it('throwIfCancellationRequested throws when cancelled', () => {
    const cts = new CancellationTokenSource();
    expect(() => cts.token.throwIfCancellationRequested()).not.toThrow();

    cts.cancel();
    expect(() => cts.token.throwIfCancellationRequested()).toThrow('Operation cancelled');
  });
});
