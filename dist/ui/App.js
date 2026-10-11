import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { commandRegistry, } from '../core/command-registry.js';
import { ProjectDiscoveryService } from '../services/project-discovery.js';
import { CancellationTokenSource } from '../core/cancellation.js';
import { Logger } from '../core/logger.js';
import { StatusBar } from './StatusBar.js';
import { SearchInput } from './SearchInput.js';
import { CommandPalette } from './CommandPalette.js';
import { OutputPanel } from './OutputPanel.js';
import { ErrorView } from './ErrorView.js';
export const App = ({ version, config, projectRoot }) => {
    const { exit } = useApp();
    const [screen, setScreen] = useState('PALETTE');
    const [search, setSearch] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [projectInfo, setProjectInfo] = useState(null);
    const [activeCommand, setActiveCommand] = useState(null);
    const [outputLogs, setOutputLogs] = useState('');
    const [commandExitCode, setCommandExitCode] = useState(null);
    const [appError, setAppError] = useState(null);
    const availableCommands = commandRegistry.getInteractiveCommands();
    const filteredCommands = availableCommands.filter((cmd) => {
        if (!search.trim())
            return true;
        const q = search.toLowerCase();
        return (cmd.name.toLowerCase().includes(q) ||
            cmd.description.toLowerCase().includes(q) ||
            cmd.category.toLowerCase().includes(q));
    });
    useEffect(() => {
        try {
            const info = ProjectDiscoveryService.detect(projectRoot);
            setProjectInfo(info);
        }
        catch {
            // Fallback
        }
    }, [projectRoot]);
    useEffect(() => {
        if (selectedIndex >= filteredCommands.length) {
            setSelectedIndex(Math.max(0, filteredCommands.length - 1));
        }
    }, [filteredCommands.length, selectedIndex]);
    const runCommand = async (cmd) => {
        setActiveCommand(cmd);
        setScreen('EXECUTING');
        setOutputLogs('');
        setCommandExitCode(null);
        const cts = new CancellationTokenSource();
        let accumulated = '';
        const capturedLogger = new Logger();
        // Intercept logs into our terminal panel state
        capturedLogger.info = (...args) => {
            const text = args.map(String).join(' ');
            accumulated += text + '\n';
            setOutputLogs(accumulated);
        };
        capturedLogger.error = (...args) => {
            const text = args.map(String).join(' ');
            accumulated += `[ERROR] ${text}\n`;
            setOutputLogs(accumulated);
        };
        capturedLogger.success = (...args) => {
            const text = args.map(String).join(' ');
            accumulated += `[OK] ${text}\n`;
            setOutputLogs(accumulated);
        };
        const ctx = {
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
        }
        catch (err) {
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
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Box, { justifyContent: "space-between", children: _jsxs(Box, { children: [_jsx(Text, { bold: true, color: "cyan", children: config.appName.toUpperCase() }), _jsxs(Text, { dimColor: true, children: [" v", version] }), _jsx(Text, { color: "gray", children: " \u2014 Developer Command Center" })] }) }), screen === 'PALETTE' && (_jsxs(Box, { flexDirection: "column", children: [_jsx(SearchInput, { value: search, isFocused: isSearchFocused }), _jsx(CommandPalette, { commands: filteredCommands, selectedIndex: selectedIndex }), projectInfo && (_jsx(StatusBar, { projectName: projectInfo.name, projectType: projectInfo.language || projectInfo.type, isGit: projectInfo.isGitRepo }))] })), (screen === 'EXECUTING' || screen === 'OUTPUT') && activeCommand && (_jsx(OutputPanel, { title: `Action: ${activeCommand.name}`, output: outputLogs, isRunning: screen === 'EXECUTING', exitCode: commandExitCode })), screen === 'ERROR' && appError && (_jsx(ErrorView, { error: appError.error, remediation: appError.remediation }))] }));
};
//# sourceMappingURL=App.js.map