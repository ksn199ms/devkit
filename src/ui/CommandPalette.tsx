import React from 'react';
import { Box, Text } from 'ink';
import type { CommandDefinition } from '../core/command-registry.js';

export interface CommandPaletteProps {
  commands: CommandDefinition[];
  selectedIndex: number;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ commands, selectedIndex }) => {
  if (commands.length === 0) {
    return (
      <Box marginY={1}>
        <Text color="yellow">No matching commands found. Press Backspace to clear search.</Text>
      </Box>
    );
  }

  const selectedCommand = commands[selectedIndex];

  return (
    <Box flexDirection="column" marginY={1}>
      <Box flexDirection="column">
        {commands.map((cmd, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <Box key={cmd.name} justifyContent="space-between">
              <Box>
                <Text color={isSelected ? 'cyan' : 'gray'}>{isSelected ? '▶ ' : '  '}</Text>
                <Text bold={isSelected} color={isSelected ? 'cyan' : undefined}>
                  {cmd.name.padEnd(16)}
                </Text>
                <Text dimColor>{cmd.description}</Text>
              </Box>
              <Box marginLeft={2}>
                <Text color="gray">[{cmd.category}]</Text>
              </Box>
            </Box>
          );
        })}
      </Box>

      {selectedCommand && (
        <Box
          marginTop={1}
          paddingX={1}
          borderStyle="single"
          borderColor="gray"
          flexDirection="column"
        >
          <Box>
            <Text bold color="cyan">
              {selectedCommand.name}
            </Text>
            <Text dimColor> — {selectedCommand.usage}</Text>
          </Box>
          <Box marginTop={1}>
            <Text>{selectedCommand.description}</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};
