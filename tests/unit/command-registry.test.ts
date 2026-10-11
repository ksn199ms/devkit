import { describe, it, expect } from 'vitest';
import { commandRegistry } from '../../src/core/command-registry.js';
import { doctorCommand } from '../../src/commands/doctor.js';

describe('CommandRegistry', () => {
  it('registers and retrieves command definitions', () => {
    const existing = commandRegistry.get('doctor');
    if (!existing) {
      commandRegistry.register(doctorCommand);
    }

    const retrieved = commandRegistry.get('doctor');
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('doctor');
    expect(retrieved?.description).toBeDefined();
    expect(retrieved?.category).toBe('diagnostics');
  });

  it('filters interactive commands properly', () => {
    const interactive = commandRegistry.getInteractiveCommands();
    expect(Array.isArray(interactive)).toBe(true);
    for (const cmd of interactive) {
      expect(cmd.interactive).toBe(true);
    }
  });
});
