import { ValidationError } from '../core/errors.js';
export class ApprovalPolicy {
    static defaultHandler = null;
    static setApprovalHandler(handler) {
        this.defaultHandler = handler;
    }
    static async requireApproval(request, isInteractive) {
        if (!request.tool.isMutating) {
            return true;
        }
        if (!isInteractive && !this.defaultHandler) {
            throw new ValidationError(`Mutating operation "${request.tool.name}" requires explicit user approval. Non-interactive execution blocked.`, 'Run the command interactively or pass explicit confirmation flags where supported.');
        }
        if (this.defaultHandler) {
            return await this.defaultHandler(request);
        }
        return false;
    }
}
//# sourceMappingURL=approval.js.map