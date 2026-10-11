export interface CancellationToken {
  readonly isCancellationRequested: boolean;
  onCancellationRequested(listener: () => void): () => void;
  throwIfCancellationRequested(): void;
  toAbortSignal(): AbortSignal;
}

export class CancellationTokenSource {
  private _isCancelled = false;
  private readonly _listeners = new Set<() => void>();
  private readonly _abortController = new AbortController();

  public get token(): CancellationToken {
    return {
      isCancellationRequested: this._isCancelled,
      onCancellationRequested: (listener: () => void) => {
        if (this._isCancelled) {
          listener();
          return () => {};
        }
        this._listeners.add(listener);
        return () => {
          this._listeners.delete(listener);
        };
      },
      throwIfCancellationRequested: () => {
        if (this._isCancelled) {
          throw new Error('Operation cancelled');
        }
      },
      toAbortSignal: () => this._abortController.signal,
    };
  }

  public cancel(): void {
    if (this._isCancelled) return;
    this._isCancelled = true;
    this._abortController.abort();
    for (const listener of this._listeners) {
      try {
        listener();
      } catch {
        // Suppress listener failure during cancellation dispatch
      }
    }
    this._listeners.clear();
  }

  public cancelAfter(ms: number): NodeJS.Timeout {
    return setTimeout(() => {
      this.cancel();
    }, ms);
  }

  public dispose(): void {
    this._listeners.clear();
  }
}
