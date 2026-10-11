import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
export const CommandPalette = ({ commands, selectedIndex }) => {
    if (commands.length === 0) {
        return (_jsx(Box, { marginY: 1, children: _jsx(Text, { color: "yellow", children: "No matching commands found. Press Backspace to clear search." }) }));
    }
    const selectedCommand = commands[selectedIndex];
    return (_jsxs(Box, { flexDirection: "column", marginY: 1, children: [_jsx(Box, { flexDirection: "column", children: commands.map((cmd, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (_jsxs(Box, { justifyContent: "space-between", children: [_jsxs(Box, { children: [_jsx(Text, { color: isSelected ? 'cyan' : 'gray', children: isSelected ? '▶ ' : '  ' }), _jsx(Text, { bold: isSelected, color: isSelected ? 'cyan' : undefined, children: cmd.name.padEnd(16) }), _jsx(Text, { dimColor: true, children: cmd.description })] }), _jsx(Box, { marginLeft: 2, children: _jsxs(Text, { color: "gray", children: ["[", cmd.category, "]"] }) })] }, cmd.name));
                }) }), selectedCommand && (_jsxs(Box, { marginTop: 1, paddingX: 1, borderStyle: "single", borderColor: "gray", flexDirection: "column", children: [_jsxs(Box, { children: [_jsx(Text, { bold: true, color: "cyan", children: selectedCommand.name }), _jsxs(Text, { dimColor: true, children: [" \u2014 ", selectedCommand.usage] })] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { children: selectedCommand.description }) })] }))] }));
};
//# sourceMappingURL=CommandPalette.js.map