export class CancellationTokenSource {
    _isCancelled = false;
    _listeners = new Set();
    _abortController = new AbortController();
    get token() {
        return {
            isCancellationRequested: this._isCancelled,
            onCancellationRequested: (listener) => {
                if (this._isCancelled) {
                    listener();
                    return () => { };
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
    cancel() {
        if (this._isCancelled)
            return;
        this._isCancelled = true;
        this._abortController.abort();
        for (const listener of this._listeners) {
            try {
                listener();
            }
            catch {
                // Suppress listener failure during cancellation dispatch
            }
        }
        this._listeners.clear();
    }
    cancelAfter(ms) {
        return setTimeout(() => {
            this.cancel();
        }, ms);
    }
    dispose() {
        this._listeners.clear();
    }
}
//# sourceMappingURL=cancellation.js.map