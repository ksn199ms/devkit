import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { FileSystemService } from '../../src/services/filesystem.js';
import { FileSystemError } from '../../src/core/errors.js';

describe('FileSystemService Security and Inspection', () => {
  const projectRoot = process.cwd();

  it('identifies sensitive file names and extensions', () => {
    expect(FileSystemService.isSensitiveFile('.env')).toBe(true);
    expect(FileSystemService.isSensitiveFile('.env.production')).toBe(true);
    expect(FileSystemService.isSensitiveFile('id_rsa')).toBe(true);
    expect(FileSystemService.isSensitiveFile('server.key')).toBe(true);
    expect(FileSystemService.isSensitiveFile('cert.pem')).toBe(true);
    expect(FileSystemService.isSensitiveFile('credentials.json')).toBe(true);

    expect(FileSystemService.isSensitiveFile('package.json')).toBe(false);
    expect(FileSystemService.isSensitiveFile('src/index.ts')).toBe(false);
  });

  it('blocks path traversal outside project root', () => {
    expect(() => {
      FileSystemService.resolveSafePath('../../escaped.txt', {
        projectRoot,
        allowExternalPaths: false,
      });
    }).toThrow(FileSystemError);
  });

  it('allows safe relative path inside project root', () => {
    const safe = FileSystemService.resolveSafePath('package.json', {
      projectRoot,
      allowExternalPaths: false,
    });
    expect(safe).toBe(path.resolve(projectRoot, 'package.json'));
  });

  it('enforces file size limits', async () => {
    // Reading package.json with tiny 0.001 KB limit should fail
    await expect(
      FileSystemService.readFile('package.json', {
        projectRoot,
        maxFileSizeKb: 0.001,
      }),
    ).rejects.toThrow(FileSystemError);
  });

  it('lists project files excluding default ignored directories', () => {
    const files = FileSystemService.listProjectFiles('.', {
      projectRoot,
      maxFiles: 50,
    });
    expect(files.length).toBeGreaterThan(0);
    // None should contain node_modules or .git
    for (const f of files) {
      expect(f.startsWith('node_modules/')).toBe(false);
      expect(f.startsWith('.git/')).toBe(false);
    }
  });
});
