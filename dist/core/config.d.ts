import { z } from 'zod';
export declare const AIProviderSchema: z.ZodEnum<["mock", "openai", "anthropic", "gemini"]>;
export type AIProviderName = z.infer<typeof AIProviderSchema>;
export declare const DevKitConfigSchema: z.ZodObject<{
    appName: z.ZodDefault<z.ZodString>;
    ai: z.ZodDefault<z.ZodObject<{
        provider: z.ZodDefault<z.ZodEnum<["mock", "openai", "anthropic", "gemini"]>>;
        model: z.ZodDefault<z.ZodString>;
        apiKey: z.ZodOptional<z.ZodString>;
        baseUrl: z.ZodOptional<z.ZodString>;
        temperature: z.ZodDefault<z.ZodNumber>;
        maxTokens: z.ZodDefault<z.ZodNumber>;
        timeoutMs: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        provider: "mock" | "openai" | "anthropic" | "gemini";
        model: string;
        temperature: number;
        maxTokens: number;
        timeoutMs: number;
        apiKey?: string | undefined;
        baseUrl?: string | undefined;
    }, {
        provider?: "mock" | "openai" | "anthropic" | "gemini" | undefined;
        model?: string | undefined;
        apiKey?: string | undefined;
        baseUrl?: string | undefined;
        temperature?: number | undefined;
        maxTokens?: number | undefined;
        timeoutMs?: number | undefined;
    }>>;
    security: z.ZodDefault<z.ZodObject<{
        allowExternalPaths: z.ZodDefault<z.ZodBoolean>;
        maxFileSizeKb: z.ZodDefault<z.ZodNumber>;
        redactSecrets: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        allowExternalPaths: boolean;
        maxFileSizeKb: number;
        redactSecrets: boolean;
    }, {
        allowExternalPaths?: boolean | undefined;
        maxFileSizeKb?: number | undefined;
        redactSecrets?: boolean | undefined;
    }>>;
    ui: z.ZodDefault<z.ZodObject<{
        theme: z.ZodDefault<z.ZodEnum<["default", "plain"]>>;
        interactive: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        theme: "default" | "plain";
        interactive: boolean;
    }, {
        theme?: "default" | "plain" | undefined;
        interactive?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    appName: string;
    ai: {
        provider: "mock" | "openai" | "anthropic" | "gemini";
        model: string;
        temperature: number;
        maxTokens: number;
        timeoutMs: number;
        apiKey?: string | undefined;
        baseUrl?: string | undefined;
    };
    security: {
        allowExternalPaths: boolean;
        maxFileSizeKb: number;
        redactSecrets: boolean;
    };
    ui: {
        theme: "default" | "plain";
        interactive: boolean;
    };
}, {
    appName?: string | undefined;
    ai?: {
        provider?: "mock" | "openai" | "anthropic" | "gemini" | undefined;
        model?: string | undefined;
        apiKey?: string | undefined;
        baseUrl?: string | undefined;
        temperature?: number | undefined;
        maxTokens?: number | undefined;
        timeoutMs?: number | undefined;
    } | undefined;
    security?: {
        allowExternalPaths?: boolean | undefined;
        maxFileSizeKb?: number | undefined;
        redactSecrets?: boolean | undefined;
    } | undefined;
    ui?: {
        theme?: "default" | "plain" | undefined;
        interactive?: boolean | undefined;
    } | undefined;
}>;
export type DevKitConfig = z.infer<typeof DevKitConfigSchema>;
export interface ConfigOverrides {
    aiProvider?: string;
    aiModel?: string;
    aiApiKey?: string;
    aiBaseUrl?: string;
    maxFileSizeKb?: number;
    configPath?: string;
}
export declare function getUserConfigDir(): string;
export declare function getUserConfigPath(): string;
export declare function getProjectConfigPath(projectRoot?: string): string | null;
export declare function loadConfig(projectRoot?: string, overrides?: ConfigOverrides): DevKitConfig;
export declare function getRedactedConfig(config: DevKitConfig): Record<string, unknown>;
export declare function saveUserConfig(partialConfig: Partial<DevKitConfig>): void;
//# sourceMappingURL=config.d.ts.map