import { describe, it, expect } from 'vitest';
import { ProjectDiscoveryService } from '../../src/services/project-discovery.js';

describe('ProjectDiscoveryService', () => {
  it('correctly detects current project workspace', () => {
    const project = ProjectDiscoveryService.detect(process.cwd());
    expect(project.type).toBe('typescript');
    expect(project.name).toBe('devkit');
    expect(project.language).toBe('TypeScript');
    expect(project.packageManager).toBe('npm');
  });

  it('handles unknown non-project directories gracefully', () => {
    const unknown = ProjectDiscoveryService.detect(process.env.TEMP || 'C:\\Windows\\Temp');
    expect(unknown.type).toBe('unknown');
    expect(unknown.rootPath).toBeDefined();
  });
});
