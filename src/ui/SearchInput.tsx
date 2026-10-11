import React from 'react';
import { Box, Text } from 'ink';

export interface SearchInputProps {
  value: string;
  isFocused: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({ value, isFocused }) => {
  return (
    <Box marginY={1}>
      <Text color={isFocused ? 'cyan' : 'gray'}>❯ Search: </Text>
      <Text bold>{value}</Text>
      {isFocused && <Text color="cyan">█</Text>}
      {value.length === 0 && !isFocused && <Text dimColor>Type to filter commands...</Text>}
    </Box>
  );
};
