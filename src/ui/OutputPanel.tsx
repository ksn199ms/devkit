import React from 'react';
import { Box, Text } from 'ink';

export interface OutputPanelProps {
  title: string;
  output: string;
  isRunning: boolean;
  exitCode?: number | null;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({ title, output, isRunning, exitCode }) => {
  return (
    <Box flexDirection="column" marginY={1}>
      <Box
        borderStyle="single"
        borderColor={isRunning ? 'cyan' : exitCode === 0 ? 'green' : 'gray'}
        paddingX={1}
      >
        <Text bold>{title}</Text>
        <Text dimColor> — </Text>
        {isRunning ? (
          <Text color="cyan">Running...</Text>
        ) : exitCode === 0 ? (
          <Text color="green">Completed (0)</Text>
        ) : (
          <Text color="red">Exited ({exitCode ?? 1})</Text>
        )}
      </Box>
      <Box flexDirection="column" paddingX={1} marginY={1}>
        {output.length > 0 ? <Text>{output}</Text> : <Text dimColor>Waiting for output...</Text>}
      </Box>
      {!isRunning && (
        <Box marginTop={1}>
          <Text dimColor>Press [Esc] or [Enter] to return to command palette.</Text>
        </Box>
      )}
    </Box>
  );
};
