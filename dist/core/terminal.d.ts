export interface TerminalCapabilities {
    supportsColor: boolean;
    isTTY: boolean;
    width: number;
    isUnicodeSupported: boolean;
}
export declare function detectTerminalCapabilities(): TerminalCapabilities;
export declare function getTerminalCapabilities(): TerminalCapabilities;
export declare function resetTerminalCapabilitiesCache(): void;
export declare const colors: {
    bold: (text: string) => string;
    dim: (text: string) => string;
    italic: (text: string) => string;
    underline: (text: string) => string;
    red: (text: string) => string;
    green: (text: string) => string;
    yellow: (text: string) => string;
    blue: (text: string) => string;
    magenta: (text: string) => string;
    cyan: (text: string) => string;
    gray: (text: string) => string;
};
export declare const symbols: {
    readonly check: string;
    readonly cross: string;
    readonly warning: string;
    readonly info: string;
    readonly bullet: string;
    readonly arrow: string;
};
export declare function stripAnsi(text: string): string;
export declare function truncate(text: string, maxLength: number): string;
export declare class TerminalSpinner {
    private text;
    private intervalId;
    private frameIndex;
    private isSpinning;
    private readonly frames;
    constructor(text?: string);
    start(text?: string): this;
    update(text: string): this;
    stop(clear?: boolean): this;
}
export declare function renderMarkdown(markdown: string): string;
//# sourceMappingURL=terminal.d.ts.map