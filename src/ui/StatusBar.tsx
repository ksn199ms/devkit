import React from 'react';
import { Box, Text } from 'ink';

export interface StatusBarProps {
  projectName: string;
  projectType: string;
  isGit: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ projectName, projectType, isGit }) => {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box borderStyle="single" borderColor="gray" paddingX={1} justifyContent="space-between">
        <Box>
          <Text dimColor>Project: </Text>
          <Text bold color="cyan">
            {projectName}
          </Text>
          <Text dimColor> ({projectType})</Text>
          {isGit && <Text color="green"> [git]</Text>}
        </Box>
        <Box>
          <Text dimColor>[↑/↓] Move [Enter] Run [/] Filter [q/Esc] Quit</Text>
        </Box>
      </Box>
    </Box>
  );
};
