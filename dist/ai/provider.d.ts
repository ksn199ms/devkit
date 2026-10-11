import type { CancellationToken } from '../core/cancellation.js';
import type { DevKitConfig } from '../core/config.js';
export interface AIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export interface AICompletionRequest {
    messages: AIMessage[];
    temperature?: number;
    maxTokens?: number;
}
export interface AICompletionResponse {
    text: string;
    usage?: {
        promptTokens?: number;
        completionTokens?: number;
    };
}
export interface AIProvider {
    readonly name: string;
    isConfigured(): boolean;
    complete(request: AICompletionRequest, cancellationToken?: CancellationToken): Promise<AICompletionResponse>;
    stream(request: AICompletionRequest, onChunk: (chunk: string) => void, cancellationToken?: CancellationToken): Promise<AICompletionResponse>;
}
export declare class MockAIProvider implements AIProvider {
    readonly name = "mock";
    isConfigured(): boolean;
    complete(request: AICompletionRequest, cancellationToken?: CancellationToken): Promise<AICompletionResponse>;
    stream(request: AICompletionRequest, onChunk: (chunk: string) => void, cancellationToken?: CancellationToken): Promise<AICompletionResponse>;
    private generateMockResponse;
}
export declare class OpenAICompatibleProvider implements AIProvider {
    readonly name: string;
    private readonly apiKey;
    private readonly baseUrl;
    private readonly model;
    private readonly timeoutMs;
    constructor(options: {
        name?: string;
        apiKey: string;
        baseUrl?: string;
        model: string;
        timeoutMs?: number;
    });
    isConfigured(): boolean;
    complete(request: AICompletionRequest, cancellationToken?: CancellationToken): Promise<AICompletionResponse>;
    stream(request: AICompletionRequest, onChunk: (chunk: string) => void, cancellationToken?: CancellationToken): Promise<AICompletionResponse>;
}
export declare function createAIProvider(config: DevKitConfig): AIProvider;
//# sourceMappingURL=provider.d.ts.map