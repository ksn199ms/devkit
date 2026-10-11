export type ProjectType = 'node' | 'typescript' | 'rust' | 'go' | 'python' | 'unknown';
export interface ProjectInfo {
    type: ProjectType;
    name: string;
    rootPath: string;
    isGitRepo: boolean;
    packageManager?: string;
    language?: string;
    framework?: string;
    details: Record<string, string>;
}
export declare class ProjectDiscoveryService {
    static detect(projectRoot?: string): ProjectInfo;
}
//# sourceMappingURL=project-discovery.d.ts.map