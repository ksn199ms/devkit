import { ValidationError } from '../core/errors.js';
import type { ToolDefinition } from './tools.js';

export interface ApprovalRequest {
  tool: ToolDefinition;
  params: unknown;
  description: string;
  affectedResources: string[];
}

export type ApprovalHandler = (request: ApprovalRequest) => Promise<boolean>;

export class ApprovalPolicy {
  private static defaultHandler: ApprovalHandler | null = null;

  public static setApprovalHandler(handler: ApprovalHandler | null): void {
    this.defaultHandler = handler;
  }

  public static async requireApproval(
    request: ApprovalRequest,
    isInteractive: boolean,
  ): Promise<boolean> {
    if (!request.tool.isMutating) {
      return true;
    }

    if (!isInteractive && !this.defaultHandler) {
      throw new ValidationError(
        `Mutating operation "${request.tool.name}" requires explicit user approval. Non-interactive execution blocked.`,
        'Run the command interactively or pass explicit confirmation flags where supported.',
      );
    }

    if (this.defaultHandler) {
      return await this.defaultHandler(request);
    }

    return false;
  }
}
