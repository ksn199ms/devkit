#!/usr/bin/env node
import { runCli } from './cli.js';
runCli(process.argv)
    .then((code) => {
    if (typeof code === 'number' && code !== 0) {
        process.exit(code);
    }
})
    .catch((err) => {
    process.stderr.write(`Fatal error: ${err.message}\n`);
    process.exit(1);
});
//# sourceMappingURL=index.js.map