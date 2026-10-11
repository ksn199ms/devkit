import { describe, it, expect } from 'vitest';
import {
  DevKitError,
  ValidationError,
  FileSystemError,
  GitError,
  AIError,
  ConfigError,
  ProcessExecutionError,
  CancellationError,
  ExitCode,
  toDevKitError,
} from '../../src/core/errors.js';

describe('Error Handling and Exit Codes', () => {
  it('correctly maps ExitCodes across typed error classes', () => {
    const valErr = new ValidationError('Bad input');
    expect(valErr.exitCode).toBe(ExitCode.VALIDATION_ERROR);
    expect(valErr.code).toBe('ERR_VALIDATION');
    expect(valErr.remediation).toBeDefined();

    const fsErr = new FileSystemError('File not found');
    expect(fsErr.exitCode).toBe(ExitCode.FILESYSTEM_ERROR);
    expect(fsErr.code).toBe('ERR_FILESYSTEM');

    const gitErr = new GitError('Not a repo');
    expect(gitErr.exitCode).toBe(ExitCode.GIT_ERROR);
    expect(gitErr.code).toBe('ERR_GIT');

    const aiErr = new AIError('API failed');
    expect(aiErr.exitCode).toBe(ExitCode.AI_ERROR);
    expect(aiErr.code).toBe('ERR_AI_PROVIDER');

    const cfgErr = new ConfigError('Invalid config');
    expect(cfgErr.exitCode).toBe(ExitCode.CONFIG_ERROR);
    expect(cfgErr.code).toBe('ERR_CONFIG');

    const procErr = new ProcessExecutionError('Process failed');
    expect(procErr.exitCode).toBe(ExitCode.PROCESS_ERROR);
    expect(procErr.code).toBe('ERR_PROCESS');

    const cancelErr = new CancellationError();
    expect(cancelErr.exitCode).toBe(ExitCode.CANCELLATION);
    expect(cancelErr.code).toBe('ERR_CANCELLED');
  });

  it('toDevKitError converts standard errors while preserving DevKitErrors', () => {
    const original = new FileSystemError('Existing');
    expect(toDevKitError(original)).toBe(original);

    const generic = new Error('Generic error');
    const converted = toDevKitError(generic);
    expect(converted).toBeInstanceOf(DevKitError);
    expect(converted.message).toBe('Generic error');
    expect(converted.exitCode).toBe(ExitCode.GENERAL_ERROR);

    const stringErr = toDevKitError('raw string error');
    expect(stringErr).toBeInstanceOf(DevKitError);
    expect(stringErr.message).toBe('raw string error');
  });
});
