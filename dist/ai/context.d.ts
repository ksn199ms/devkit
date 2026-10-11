import type { DevKitConfig } from '../core/config.js';
export interface AIContextOptions {
    projectRoot: string;
    config: DevKitConfig;
    includeFiles?: string[];
    maxCharacters?: number;
}
export interface AssembledAIContext {
    systemPrompt: string;
    projectSummary: string;
    filesContent: Record<string, string>;
}
export declare class AIContextBuilder {
    static buildContext(options: AIContextOptions): Promise<AssembledAIContext>;
}
//# sourceMappingURL=context.d.ts.map