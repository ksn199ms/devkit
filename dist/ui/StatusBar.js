import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
export const StatusBar = ({ projectName, projectType, isGit }) => {
    return (_jsx(Box, { flexDirection: "column", marginTop: 1, children: _jsxs(Box, { borderStyle: "single", borderColor: "gray", paddingX: 1, justifyContent: "space-between", children: [_jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "Project: " }), _jsx(Text, { bold: true, color: "cyan", children: projectName }), _jsxs(Text, { dimColor: true, children: [" (", projectType, ")"] }), isGit && _jsx(Text, { color: "green", children: " [git]" })] }), _jsx(Box, { children: _jsx(Text, { dimColor: true, children: "[\u2191/\u2193] Move [Enter] Run [/] Filter [q/Esc] Quit" }) })] }) }));
};
//# sourceMappingURL=StatusBar.js.map