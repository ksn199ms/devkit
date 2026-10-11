import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Text } from 'ink';
export const ErrorView = ({ error, remediation }) => {
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "single", borderColor: "red", paddingX: 1, marginY: 1, children: [_jsxs(Box, { children: [_jsxs(Text, { bold: true, color: "red", children: ["ERROR:", ' '] }), _jsx(Text, { children: error.message })] }), remediation && (_jsxs(Box, { marginTop: 1, children: [_jsx(Text, { dimColor: true, children: "Remediation: " }), _jsx(Text, { color: "yellow", children: remediation })] }))] }));
};
//# sourceMappingURL=ErrorView.js.map