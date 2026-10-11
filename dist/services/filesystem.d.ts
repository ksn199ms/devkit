export interface FileInspectionOptions {
    projectRoot: string;
    allowExternalPaths?: boolean;
    maxFileSizeKb?: number;
}
export declare class FileSystemService {
    static isSensitiveFile(filePath: string): boolean;
    static resolveSafePath(targetPath: string, options: FileInspectionOptions): string;
    static readFile(targetPath: string, options: FileInspectionOptions): Promise<{
        content: string;
        sizeBytes: number;
        path: string;
    }>;
    static listProjectFiles(dirPath: string, options: FileInspectionOptions & {
        maxDepth?: number;
        maxFiles?: number;
    }): string[];
    static writeFileAtomic(targetPath: string, content: string, options: FileInspectionOptions): Promise<void>;
}
//# sourceMappingURL=filesystem.d.ts.map