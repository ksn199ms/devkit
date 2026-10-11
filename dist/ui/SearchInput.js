import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
export const SearchInput = ({ value, isFocused }) => {
    return (_jsxs(Box, { marginY: 1, children: [_jsx(Text, { color: isFocused ? 'cyan' : 'gray', children: "\u276F Search: " }), _jsx(Text, { bold: true, children: value }), isFocused && _jsx(Text, { color: "cyan", children: "\u2588" }), value.length === 0 && !isFocused && _jsx(Text, { dimColor: true, children: "Type to filter commands..." })] }));
};
//# sourceMappingURL=SearchInput.js.map