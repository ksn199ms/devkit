import React from 'react';
import { Box, Text } from 'ink';

export interface ErrorViewProps {
  error: Error;
  remediation?: string;
}

export const ErrorView: React.FC<ErrorViewProps> = ({ error, remediation }) => {
  return (
    <Box flexDirection="column" borderStyle="single" borderColor="red" paddingX={1} marginY={1}>
      <Box>
        <Text bold color="red">
          ERROR:{' '}
        </Text>
        <Text>{error.message}</Text>
      </Box>
      {remediation && (
        <Box marginTop={1}>
          <Text dimColor>Remediation: </Text>
          <Text color="yellow">{remediation}</Text>
        </Box>
      )}
    </Box>
  );
};
