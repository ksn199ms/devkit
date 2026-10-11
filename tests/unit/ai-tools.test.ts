import { describe, it, expect } from 'vitest';
import { executeToolSafely, findTool } from '../../src/ai/tools.js';
import { ApprovalPolicy } from '../../src/ai/approval.js';
import { loadConfig } from '../../src/core/config.js';
import { ValidationError } from '../../src/core/errors.js';

describe('AI Tools and Security Policies', () => {
  const config = loadConfig(process.cwd());
  const ctx = {
    projectRoot: process.cwd(),
    config,
  };

  it('retrieves tools with proper schemas', () => {
    const readFile = findTool('read_file');
    expect(readFile).toBeDefined();
    expect(readFile?.isMutating).toBe(false);

    const applyPatch = findTool('apply_patch');
    expect(applyPatch).toBeDefined();
    expect(applyPatch?.isMutating).toBe(true);
  });

  it('read_file executes within project boundary', async () => {
    const res = await executeToolSafely('read_file', { filePath: 'package.json' }, ctx);
    expect(res.success).toBe(true);
    const data = res.result as { content: string };
    expect(data.content).toContain('devkit');
  });

  it('read_file rejects invalid parameters', async () => {
    const res = await executeToolSafely('read_file', { filePath: '' }, ctx);
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it('run_diagnostic rejects unapproved commands outside allowlist', async () => {
    const res = await executeToolSafely('run_diagnostic', { command: 'rm -rf /' }, ctx);
    expect(res.success).toBe(false);
    expect(res.error).toContain('not in the approved diagnostic allowlist');
  });

  it('ApprovalPolicy blocks mutating tools in non-interactive mode without handler', async () => {
    const mutatingTool = findTool('apply_patch')!;
    ApprovalPolicy.setApprovalHandler(null);

    await expect(
      ApprovalPolicy.requireApproval(
        {
          tool: mutatingTool,
          params: {},
          description: 'Modify file',
          affectedResources: ['src/test.ts'],
        },
        false,
      ),
    ).rejects.toThrow(ValidationError);
  });
});
