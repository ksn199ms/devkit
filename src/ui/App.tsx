import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import {
  commandRegistry,
  type CommandDefinition,
  type ExecutionContext,
} from '../core/command-registry.js';
import { ProjectDiscoveryService, type ProjectInfo } from '../services/project-discovery.js';
import { CancellationTokenSource } from '../core/cancellation.js';
import { Logger } from '../core/logger.js';
import type { DevKitConfig } from '../core/config.js';
import { StatusBar } from './StatusBar.js';
import { SearchInput } from './SearchInput.js';
import { CommandPalette } from './CommandPalette.js';
import { OutputPanel } from './OutputPanel.js';
import { ErrorView } from './ErrorView.js';

export interface AppProps {
  version: string;
  config: DevKitConfig;
  projectRoot: string;
}

type AppScreen = 'PALETTE' | 'EXECUTING' | 'OUTPUT' | 'ERROR';

export const App: React.FC<AppProps> = ({ version, config, projectRoot }) => {
  const { exit } = useApp();
  const [screen, setScreen] = useState<AppScreen>('PALETTE');
  const [search, setSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [activeCommand, setActiveCommand] = useState<CommandDefinition | null>(null);
  const [outputLogs, setOutputLogs] = useState<string>('');
  const [commandExitCode, setCommandExitCode] = useState<number | null>(null);
  const [appError, setAppError] = useState<{ error: Error; remediation?: string } | null>(null);

  const availableCommands = commandRegistry.getInteractiveCommands();
  const filteredCommands = availableCommands.filter((cmd) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      cmd.name.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    try {
      const info = ProjectDiscoveryService.detect(projectRoot);
      setProjectInfo(info);
    } catch {
      // Fallback
    }
  }, [projectRoot]);

  useEffect(() => {
    if (selectedIndex >= filteredCommands.length) {
      setSelectedIndex(Math.max(0, filteredCommands.length - 1));
    }
  }, [filteredCommands.length, selectedIndex]);

  const runCommand = async (cmd: CommandDefinition) => {
    setActiveCommand(cmd);
    setScreen('EXECUTING');
    setOutputLogs('');
    setCommandExitCode(null);

    const cts = new CancellationTokenSource();
    let accumulated = '';

    const capturedLogger = new Logger();
    // Intercept logs into our terminal panel state
    capturedLogger.info = (...args: unknown[]) => {
      const text = args.map(String).join(' ');
      accumulated += text + '\n';
      setOutputLogs(accumulated);
    };
    capturedLogger.error = (...args: unknown[]) => {
      const text = args.map(String).join(' ');
      accumulated += `[ERROR] ${text}\n`;
      setOutputLogs(accumulated);
    };
    capturedLogger.success = (...args: unknown[]) => {
      const text = args.map(String).join(' ');
      accumulated += `[OK] ${text}\n`;
      setOutputLogs(accumulated);
    };

    const ctx: ExecutionContext = {
      config,
      logger: capturedLogger,
      cancellationToken: cts.token,
      projectRoot,
      args: [],
      options: {},
      interactive: true,
    };

    try {
      const code = await cmd.action(ctx);
      setCommandExitCode(typeof code === 'number' ? code : 0);
      setScreen('OUTPUT');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setAppError({ error });
      setScreen('ERROR');
    }
  };

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
      return;
    }

    if (screen === 'OUTPUT' || screen === 'ERROR') {
      if (key.escape || key.return) {
        setScreen('PALETTE');
        setActiveCommand(null);
        setAppError(null);
      }
      return;
    }

    if (screen === 'PALETTE') {
      if (isSearchFocused) {
        if (key.escape || key.return) {
          setIsSearchFocused(false);
          return;
        }
        if (key.backspace || key.delete) {
          setSearch((prev) => prev.slice(0, -1));
          return;
        }
        if (input && !key.ctrl && !key.meta) {
          setSearch((prev) => prev + input);
          return;
        }
      }

      if (input === '/' && !isSearchFocused) {
        setIsSearchFocused(true);
        return;
      }

      if (key.upArrow) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
        return;
      }

      if (key.downArrow) {
        setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
        return;
      }

      if (key.return) {
        const cmd = filteredCommands[selectedIndex];
        if (cmd) {
          runCommand(cmd);
        }
        return;
      }

      if (key.escape || input === 'q') {
        exit();
        return;
      }
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box justifyContent="space-between">
        <Box>
          <Text bold color="cyan">
            {config.appName.toUpperCase()}
          </Text>
          <Text dimColor> v{version}</Text>
          <Text color="gray"> — Developer Command Center</Text>
        </Box>
      </Box>

      {/* Main Body */}
      {screen === 'PALETTE' && (
        <Box flexDirection="column">
          <SearchInput value={search} isFocused={isSearchFocused} />
          <CommandPalette commands={filteredCommands} selectedIndex={selectedIndex} />
          {projectInfo && (
            <StatusBar
              projectName={projectInfo.name}
              projectType={projectInfo.language || projectInfo.type}
              isGit={projectInfo.isGitRepo}
            />
          )}
        </Box>
      )}

      {(screen === 'EXECUTING' || screen === 'OUTPUT') && activeCommand && (
        <OutputPanel
          title={`Action: ${activeCommand.name}`}
          output={outputLogs}
          isRunning={screen === 'EXECUTING'}
          exitCode={commandExitCode}
        />
      )}

      {screen === 'ERROR' && appError && (
        <ErrorView error={appError.error} remediation={appError.remediation} />
      )}
    </Box>
  );
};
