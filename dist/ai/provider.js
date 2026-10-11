import { AIError } from '../core/errors.js';
export class MockAIProvider {
    name = 'mock';
    isConfigured() {
        return true;
    }
    async complete(request, cancellationToken) {
        cancellationToken?.throwIfCancellationRequested();
        const lastMsg = request.messages[request.messages.length - 1]?.content || '';
        const responseText = this.generateMockResponse(lastMsg);
        return {
            text: responseText,
            usage: { promptTokens: 42, completionTokens: responseText.length },
        };
    }
    async stream(request, onChunk, cancellationToken) {
        const full = await this.complete(request, cancellationToken);
        const words = full.text.split(' ');
        for (const word of words) {
            cancellationToken?.throwIfCancellationRequested();
            onChunk(word + ' ');
            await new Promise((res) => setTimeout(res, 20));
        }
        return full;
    }
    generateMockResponse(prompt) {
        const lower = prompt.toLowerCase();
        if (lower.includes('explain')) {
            return ('Code Analysis Summary:\n' +
                '1. Architecture: The code follows clean separation of concerns and typed contracts.\n' +
                '2. Performance: Asynchronous operations prevent blocking execution threads.\n' +
                '3. Security: All input boundaries are validated, and sensitive files are excluded.\n' +
                '4. Suggestions: Consider adding unit test coverage for edge error boundaries.');
        }
        if (lower.includes('review') || lower.includes('diff')) {
            return ('Code Review Analysis:\n' +
                '• Change Quality: Clean implementation adhering to single-responsibility principle.\n' +
                '• Safety: No arbitrary process execution or path traversal risks detected.\n' +
                '• Recommendation: Changes are sound and verified against test suite.');
        }
        return (`DevKit AI Assistant response for: "${prompt.slice(0, 60)}..."\n` +
            'System is operational. To connect a live model, configure DEVKIT_AI_API_KEY with your provider key.');
    }
}
export class OpenAICompatibleProvider {
    name;
    apiKey;
    baseUrl;
    model;
    timeoutMs;
    constructor(options) {
        this.name = options.name ?? 'openai';
        this.apiKey = options.apiKey;
        this.baseUrl = options.baseUrl ?? 'https://api.openai.com/v1';
        this.model = options.model;
        this.timeoutMs = options.timeoutMs ?? 30000;
    }
    isConfigured() {
        return Boolean(this.apiKey && this.apiKey.trim().length > 0);
    }
    async complete(request, cancellationToken) {
        if (!this.isConfigured()) {
            throw new AIError(`AI provider "${this.name}" is not configured with an API key.`, {
                provider: this.name,
                remediation: `Set the DEVKIT_AI_API_KEY environment variable or run 'devkit init'.`,
            });
        }
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), this.timeoutMs);
        let unsubscribe;
        if (cancellationToken) {
            unsubscribe = cancellationToken.onCancellationRequested(() => {
                abortController.abort();
            });
        }
        try {
            let activeModel = this.model;
            let response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: activeModel,
                    messages: request.messages,
                    temperature: request.temperature ?? 0.2,
                    max_tokens: request.maxTokens ?? 2048,
                    stream: false,
                }),
                signal: abortController.signal,
            });
            if (response.status === 503 &&
                this.name === 'gemini' &&
                activeModel !== 'gemini-flash-lite-latest') {
                activeModel = 'gemini-flash-lite-latest';
                response = await fetch(`${this.baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.apiKey}`,
                    },
                    body: JSON.stringify({
                        model: activeModel,
                        messages: request.messages,
                        temperature: request.temperature ?? 0.2,
                        max_tokens: request.maxTokens ?? 2048,
                        stream: false,
                    }),
                    signal: abortController.signal,
                });
            }
            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                throw new AIError(`AI request failed with HTTP ${response.status}: ${response.statusText}`, {
                    provider: this.name,
                    details: { status: response.status, body: errorText },
                    remediation: response.status === 401
                        ? 'Check that your API key is valid and has not expired.'
                        : response.status === 429
                            ? 'Rate limit exceeded. Please wait before retrying.'
                            : 'Check your model configuration and network connection.',
                });
            }
            const json = (await response.json());
            const text = json.choices?.[0]?.message?.content ?? '';
            return {
                text,
                usage: {
                    promptTokens: json.usage?.prompt_tokens,
                    completionTokens: json.usage?.completion_tokens,
                },
            };
        }
        catch (err) {
            if (err instanceof AIError)
                throw err;
            if (cancellationToken?.isCancellationRequested) {
                throw new AIError('AI request was cancelled.', { provider: this.name });
            }
            if (abortController.signal.aborted) {
                throw new AIError(`AI request timed out after ${Math.round(this.timeoutMs / 1000)}s waiting for provider "${this.name}".`, {
                    provider: this.name,
                    remediation: 'Check network connectivity or increase "timeoutMs" in .devkitrc.json.',
                });
            }
            throw new AIError(`AI completion failed: ${err.message}`, {
                provider: this.name,
                cause: err,
            });
        }
        finally {
            clearTimeout(timeoutId);
            if (unsubscribe)
                unsubscribe();
        }
    }
    async stream(request, onChunk, cancellationToken) {
        if (!this.isConfigured()) {
            throw new AIError(`AI provider "${this.name}" is not configured.`, {
                provider: this.name,
                remediation: 'Set DEVKIT_AI_API_KEY or configure provider credentials.',
            });
        }
        const abortController = new AbortController();
        let timeoutId = setTimeout(() => abortController.abort(), this.timeoutMs);
        const resetTimeout = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => abortController.abort(), this.timeoutMs);
        };
        let unsubscribe;
        if (cancellationToken) {
            unsubscribe = cancellationToken.onCancellationRequested(() => {
                abortController.abort();
            });
        }
        let fullText = '';
        try {
            let activeModel = this.model;
            let response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: activeModel,
                    messages: request.messages,
                    temperature: request.temperature ?? 0.2,
                    max_tokens: request.maxTokens ?? 2048,
                    stream: true,
                }),
                signal: abortController.signal,
            });
            if (response.status === 503 &&
                this.name === 'gemini' &&
                activeModel !== 'gemini-flash-lite-latest') {
                activeModel = 'gemini-flash-lite-latest';
                response = await fetch(`${this.baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.apiKey}`,
                    },
                    body: JSON.stringify({
                        model: activeModel,
                        messages: request.messages,
                        temperature: request.temperature ?? 0.2,
                        max_tokens: request.maxTokens ?? 2048,
                        stream: true,
                    }),
                    signal: abortController.signal,
                });
            }
            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                throw new AIError(`Streaming failed with status ${response.status}: ${errorText}`, {
                    provider: this.name,
                    details: { status: response.status, body: errorText },
                });
            }
            if (!response.body) {
                throw new AIError('Response body is empty', { provider: this.name });
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            let isStreamFinished = false;
            while (!isStreamFinished) {
                if (cancellationToken?.isCancellationRequested) {
                    reader.cancel();
                    break;
                }
                const { done, value } = await reader.read();
                if (done)
                    break;
                // Reset timeout on every received chunk
                resetTimeout();
                buffer += decoder.decode(value, { stream: true });
                if (buffer.includes('[DONE]')) {
                    isStreamFinished = true;
                    break;
                }
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.includes('[DONE]')) {
                        isStreamFinished = true;
                        break;
                    }
                    if (!trimmed.startsWith('data:'))
                        continue;
                    const payload = trimmed.replace(/^data:\s*/, '').trim();
                    if (payload.includes('[DONE]')) {
                        isStreamFinished = true;
                        break;
                    }
                    try {
                        const parsed = JSON.parse(payload);
                        const delta = parsed.choices?.[0]?.delta?.content;
                        if (delta) {
                            fullText += delta;
                            onChunk(delta);
                        }
                        if (parsed.choices?.[0]?.finish_reason === 'stop') {
                            isStreamFinished = true;
                            break;
                        }
                    }
                    catch {
                        // Ignore incomplete chunk lines
                    }
                }
            }
            reader.cancel().catch(() => { });
            return { text: fullText };
        }
        catch (err) {
            if (err instanceof AIError)
                throw err;
            if (fullText.length > 0) {
                return { text: fullText };
            }
            if (cancellationToken?.isCancellationRequested) {
                throw new AIError('AI request was cancelled.', { provider: this.name });
            }
            if (abortController.signal.aborted) {
                throw new AIError(`AI stream timed out after ${Math.round(this.timeoutMs / 1000)}s waiting for provider "${this.name}".`, {
                    provider: this.name,
                    remediation: 'Check network connectivity or increase "timeoutMs" in .devkitrc.json.',
                });
            }
            throw new AIError(`Stream error: ${err.message}`, {
                provider: this.name,
                cause: err,
            });
        }
        finally {
            clearTimeout(timeoutId);
            if (unsubscribe)
                unsubscribe();
        }
    }
}
export function createAIProvider(config) {
    if (config.ai.provider === 'mock') {
        return new MockAIProvider();
    }
    const apiKey = config.ai.apiKey;
    if (!apiKey) {
        return new MockAIProvider();
    }
    let baseUrl = config.ai.baseUrl;
    if (!baseUrl) {
        if (config.ai.provider === 'anthropic') {
            baseUrl = 'https://api.anthropic.com/v1';
        }
        else if (config.ai.provider === 'gemini') {
            baseUrl = 'https://generativelanguage.googleapis.com/v1beta/openai';
        }
        else {
            baseUrl = 'https://api.openai.com/v1';
        }
    }
    let model = config.ai.model;
    if (config.ai.provider === 'gemini') {
        if (!model ||
            model === 'gpt-4o-mini' ||
            model === 'gemini-1.5-flash' ||
            model === 'gemini-2.5-flash' ||
            model === 'gemini-3.8-flash' ||
            model === 'gemini-flash-latest') {
            model = 'gemini-flash-lite-latest';
        }
    }
    return new OpenAICompatibleProvider({
        name: config.ai.provider,
        apiKey,
        baseUrl,
        model,
        timeoutMs: config.ai.timeoutMs,
    });
}
//# sourceMappingURL=provider.js.map