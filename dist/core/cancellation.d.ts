export interface CancellationToken {
    readonly isCancellationRequested: boolean;
    onCancellationRequested(listener: () => void): () => void;
    throwIfCancellationRequested(): void;
    toAbortSignal(): AbortSignal;
}
export declare class CancellationTokenSource {
    private _isCancelled;
    private readonly _listeners;
    private readonly _abortController;
    get token(): CancellationToken;
    cancel(): void;
    cancelAfter(ms: number): NodeJS.Timeout;
    dispose(): void;
}
//# sourceMappingURL=cancellation.d.ts.map