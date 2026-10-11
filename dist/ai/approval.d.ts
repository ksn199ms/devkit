import type { ToolDefinition } from './tools.js';
export interface ApprovalRequest {
    tool: ToolDefinition;
    params: unknown;
    description: string;
    affectedResources: string[];
}
export type ApprovalHandler = (request: ApprovalRequest) => Promise<boolean>;
export declare class ApprovalPolicy {
    private static defaultHandler;
    static setApprovalHandler(handler: ApprovalHandler | null): void;
    static requireApproval(request: ApprovalRequest, isInteractive: boolean): Promise<boolean>;
}
//# sourceMappingURL=approval.d.ts.map