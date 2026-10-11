import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { z } from 'zod';
import { ConfigError } from './errors.js';
export const AIProviderSchema = z.enum(['mock', 'openai', 'anthropic', 'gemini']);
export const DevKitConfigSchema = z.object({
    appName: z.string().default('devkit'),
    ai: z
        .object({
        provider: AIProviderSchema.default('gemini'),
        model: z.string().default('gemini-flash-lite-latest'),
        apiKey: z.string().optional(),
        baseUrl: z.string().optional(),
        temperature: z.number().min(0).max(2).default(0.2),
        maxTokens: z.number().int().positive().default(2048),
        timeoutMs: z.number().int().positive().default(60000),
    })
        .default({
        provider: 'gemini',
        model: 'gemini-flash-lite-latest',
        temperature: 0.2,
        maxTokens: 2048,
        timeoutMs: 60000,
    }),
    security: z
        .object({
        allowExternalPaths: z.boolean().default(false),
        maxFileSizeKb: z.number().int().positive().default(512),
        redactSecrets: z.boolean().default(true),
    })
        .default({
        allowExternalPaths: false,
        maxFileSizeKb: 512,
        redactSecrets: true,
    }),
    ui: z
        .object({
        theme: z.enum(['default', 'plain']).default('default'),
        interactive: z.boolean().default(true),
    })
        .default({
        theme: 'default',
        interactive: true,
    }),
});
export function getUserConfigDir() {
    if (process.platform === 'win32') {
        const appData = process.env['APPDATA'] || path.join(os.homedir(), 'AppData', 'Roaming');
        return path.join(appData, 'devkit');
    }
    const xdg = process.env['XDG_CONFIG_HOME'] || path.join(os.homedir(), '.config');
    return path.join(xdg, 'devkit');
}
export function getUserConfigPath() {
    return path.join(getUserConfigDir(), 'config.json');
}
export function getProjectConfigPath(projectRoot = process.cwd()) {
    const primary = path.join(projectRoot, '.devkitrc.json');
    if (fs.existsSync(primary))
        return primary;
    const secondary = path.join(projectRoot, 'devkit.config.json');
    if (fs.existsSync(secondary))
        return secondary;
    return null;
}
function readJsonFile(filePath) {
    try {
        if (!fs.existsSync(filePath))
            return null;
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    }
    catch (err) {
        throw new ConfigError(`Failed to parse config file at "${filePath}": ${err.message}`, 'Ensure the config file contains valid JSON formatting.', { filePath });
    }
}
function cleanEnvValue(val) {
    let v = val.trim();
    if (v.startsWith('"')) {
        const endQuote = v.indexOf('"', 1);
        if (endQuote !== -1) {
            return v.slice(1, endQuote).trim();
        }
    }
    else if (v.startsWith("'")) {
        const endQuote = v.indexOf("'", 1);
        if (endQuote !== -1) {
            return v.slice(1, endQuote).trim();
        }
    }
    const hashIdx = v.indexOf('#');
    if (hashIdx !== -1) {
        v = v.slice(0, hashIdx);
    }
    return v.trim();
}
function readEnvFileKeys(projectRoot) {
    const envPath = path.join(projectRoot, '.env');
    if (!fs.existsSync(envPath))
        return {};
    try {
        const content = fs.readFileSync(envPath, 'utf-8');
        const result = {};
        for (const rawLine of content.split('\n')) {
            const line = rawLine.trim();
            if (!line || line.startsWith('#'))
                continue;
            const eqIdx = line.indexOf('=');
            if (eqIdx !== -1) {
                const key = line.slice(0, eqIdx).trim();
                const rawVal = line.slice(eqIdx + 1);
                result[key] = cleanEnvValue(rawVal);
            }
        }
        return result;
    }
    catch {
        return {};
    }
}
export function loadConfig(projectRoot = process.cwd(), overrides) {
    // 1. Built-in defaults from schema
    const baseDefaults = DevKitConfigSchema.parse({});
    // 2. User config
    const userConfigPath = getUserConfigPath();
    const userConfigData = readJsonFile(userConfigPath) || {};
    // 3. Project config
    const projectConfigPath = overrides?.configPath || getProjectConfigPath(projectRoot);
    const projectConfigData = projectConfigPath ? readJsonFile(projectConfigPath) || {} : {};
    // 4. Environment variables and local .env fallback
    const localEnv = readEnvFileKeys(projectRoot);
    const envConfig = {};
    const envAi = {};
    const providerEnv = process.env['DEVKIT_AI_PROVIDER'] || localEnv['DEVKIT_AI_PROVIDER'];
    const modelEnv = process.env['DEVKIT_AI_MODEL'] || localEnv['DEVKIT_AI_MODEL'];
    const baseUrlEnv = process.env['DEVKIT_AI_BASE_URL'] || localEnv['DEVKIT_AI_BASE_URL'];
    if (providerEnv)
        envAi['provider'] = providerEnv;
    if (modelEnv)
        envAi['model'] = modelEnv;
    if (baseUrlEnv)
        envAi['baseUrl'] = baseUrlEnv;
    const apiKeyEnv = process.env['DEVKIT_AI_API_KEY'] ||
        process.env['GEMINI_API_KEY'] ||
        process.env['OPENAI_API_KEY'] ||
        process.env['ANTHROPIC_API_KEY'] ||
        localEnv['DEVKIT_AI_API_KEY'] ||
        localEnv['GEMINI_API_KEY'] ||
        localEnv['OPENAI_API_KEY'] ||
        localEnv['ANTHROPIC_API_KEY'];
    if (apiKeyEnv) {
        envAi['apiKey'] = apiKeyEnv;
        if (!providerEnv) {
            if (process.env['GEMINI_API_KEY'] || localEnv['GEMINI_API_KEY']) {
                envAi['provider'] = 'gemini';
            }
            else if (process.env['ANTHROPIC_API_KEY'] || localEnv['ANTHROPIC_API_KEY']) {
                envAi['provider'] = 'anthropic';
            }
            else if (process.env['OPENAI_API_KEY'] || localEnv['OPENAI_API_KEY']) {
                envAi['provider'] = 'openai';
            }
        }
    }
    if (Object.keys(envAi).length > 0) {
        envConfig['ai'] = envAi;
    }
    if (process.env['DEVKIT_MAX_FILE_SIZE_KB']) {
        const parsed = Number.parseInt(process.env['DEVKIT_MAX_FILE_SIZE_KB'], 10);
        if (!Number.isNaN(parsed)) {
            envConfig['security'] = { maxFileSizeKb: parsed };
        }
    }
    // 5. CLI overrides
    const cliConfig = {};
    const cliAi = {};
    if (overrides?.aiProvider)
        cliAi['provider'] = overrides.aiProvider;
    if (overrides?.aiModel)
        cliAi['model'] = overrides.aiModel;
    if (overrides?.aiApiKey !== undefined)
        cliAi['apiKey'] = overrides.aiApiKey;
    if (overrides?.aiBaseUrl)
        cliAi['baseUrl'] = overrides.aiBaseUrl;
    if (Object.keys(cliAi).length > 0) {
        cliConfig['ai'] = cliAi;
    }
    if (overrides?.maxFileSizeKb !== undefined) {
        cliConfig['security'] = { maxFileSizeKb: overrides.maxFileSizeKb };
    }
    // Deep merge precedence: Defaults < User < Project < Environment < CLI
    const merged = deepMerge(baseDefaults, userConfigData, projectConfigData, envConfig, cliConfig);
    const parsed = DevKitConfigSchema.safeParse(merged);
    if (!parsed.success) {
        const issueSummary = parsed.error.issues
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join('; ');
        throw new ConfigError(`Configuration validation failed: ${issueSummary}`, 'Correct the configuration values in your config file or environment variables.', { issues: parsed.error.issues });
    }
    return parsed.data;
}
export function getRedactedConfig(config) {
    const cloned = JSON.parse(JSON.stringify(config));
    if (cloned.ai.apiKey) {
        cloned.ai.apiKey = '[REDACTED]';
    }
    return cloned;
}
export function saveUserConfig(partialConfig) {
    const configDir = getUserConfigDir();
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    const configPath = getUserConfigPath();
    const existing = readJsonFile(configPath) || {};
    const updated = deepMerge(existing, partialConfig);
    const tmpPath = `${configPath}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpPath, JSON.stringify(updated, null, 2), { encoding: 'utf-8', mode: 0o600 });
    fs.renameSync(tmpPath, configPath);
}
function isObject(item) {
    return Boolean(item && typeof item === 'object' && !Array.isArray(item));
}
function deepMerge(target, ...sources) {
    const result = { ...target };
    for (const source of sources) {
        if (!isObject(source))
            continue;
        for (const [key, value] of Object.entries(source)) {
            if (value === undefined)
                continue;
            if (isObject(value) && isObject(result[key])) {
                result[key] = deepMerge(result[key], value);
            }
            else {
                result[key] = value;
            }
        }
    }
    return result;
}
//# sourceMappingURL=config.js.map