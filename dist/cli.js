import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import { commandRegistry } from './core/command-registry.js';
import { loadConfig } from './core/config.js';
import { logger } from './core/logger.js';
import { CancellationTokenSource } from './core/cancellation.js';
import { toDevKitError, ExitCode } from './core/errors.js';
import { colors } from './core/terminal.js';
import { App } from './ui/App.js';
// Import all commands to register them
import { initCommand } from './commands/init.js';
import { doctorCommand } from './commands/doctor.js';
import { explainCommand } from './commands/explain.js';
import { reviewCommand } from './commands/review.js';
import { chatCommand } from './commands/chat.js';
export const CLI_VERSION = '0.1.0';
let isRegistered = false;
export function registerBuiltinCommands() {
    if (isRegistered)
        return;
    commandRegistry.register(initCommand);
    commandRegistry.register(doctorCommand);
    commandRegistry.register(explainCommand);
    commandRegistry.register(reviewCommand);
    commandRegistry.register(chatCommand);
    isRegistered = true;
}
export async function runCli(argv) {
    registerBuiltinCommands();
    const program = new Command();
    program
        .name('devkit')
        .description('Production-ready interactive developer CLI and workspace toolkit')
        .version(CLI_VERSION, '-v, --version', 'Output current devkit version')
        .option('-c, --config <path>', 'Custom path to devkit configuration file')
        .option('--debug', 'Enable debug logging and show full stack traces')
        .option('--json', 'Output machine-readable JSON logs')
        .option('--no-color', 'Disable colorized terminal output');
    const cts = new CancellationTokenSource();
    const onSignal = () => {
        cts.cancel();
        process.stderr.write(`\n${colors.yellow('Operation cancelled by user.')}\n`);
        process.exit(ExitCode.CANCELLATION);
    };
    process.on('SIGINT', onSignal);
    process.on('SIGTERM', onSignal);
    // Wire each registry command into Commander
    for (const def of commandRegistry.getAll()) {
        let cmd = program.command(def.name).description(def.description);
        if (def.aliases) {
            for (const alias of def.aliases) {
                cmd = cmd.alias(alias);
            }
        }
        if (def.arguments) {
            for (const arg of def.arguments) {
                cmd = cmd.argument(arg.required ? `<${arg.name}>` : `[${arg.name}]`, arg.description);
            }
        }
        if (def.options) {
            for (const opt of def.options) {
                if (opt.defaultValue !== undefined) {
                    cmd = cmd.option(opt.flags, opt.description, String(opt.defaultValue));
                }
                else {
                    cmd = cmd.option(opt.flags, opt.description);
                }
            }
        }
        cmd.action(async (...actionArgs) => {
            const globalOpts = program.opts();
            if (globalOpts.debug)
                logger.setLevel('debug');
            if (globalOpts.json)
                logger.setJsonMode(true);
            const commandOpts = (actionArgs[actionArgs.length - 2] ?? {});
            const rawArgs = actionArgs.slice(0, actionArgs.length - 2);
            const overrides = {
                configPath: globalOpts.config,
            };
            const config = loadConfig(process.cwd(), overrides);
            const ctx = {
                config,
                logger,
                cancellationToken: cts.token,
                projectRoot: process.cwd(),
                args: rawArgs,
                options: commandOpts,
                interactive: false,
            };
            try {
                const result = await def.action(ctx);
                const exitCode = typeof result === 'number' ? result : ExitCode.SUCCESS;
                process.exitCode = exitCode;
            }
            catch (err) {
                const devKitErr = toDevKitError(err);
                logger.error(devKitErr.message);
                if (devKitErr.remediation) {
                    logger.info(`Remediation: ${devKitErr.remediation}`);
                }
                if (globalOpts.debug && devKitErr.stack) {
                    logger.debug(devKitErr.stack);
                }
                process.exitCode = devKitErr.exitCode;
            }
        });
    }
    // Check if run without subcommands (Mode A: Interactive)
    const args = argv.slice(2);
    const isHelpOrVersion = args.some((a) => ['-h', '--help', '-v', '--version'].includes(a));
    if (args.length === 0 && !isHelpOrVersion) {
        const config = loadConfig(process.cwd());
        if (process.stdout.isTTY && !process.env['CI']) {
            // Interactive Mode A
            const { waitUntilExit } = render(React.createElement(App, {
                version: CLI_VERSION,
                config,
                projectRoot: process.cwd(),
            }));
            await waitUntilExit();
            return ExitCode.SUCCESS;
        }
        else {
            // Non-interactive fallback when stdout is not a TTY or in CI
            program.outputHelp();
            return ExitCode.SUCCESS;
        }
    }
    // Mode B: Non-interactive Commander dispatch
    try {
        await program.parseAsync(argv);
        const code = process.exitCode;
        return typeof code === 'number' ? code : ExitCode.SUCCESS;
    }
    catch (err) {
        const devKitErr = toDevKitError(err);
        logger.error(devKitErr.message);
        return devKitErr.exitCode;
    }
}
//# sourceMappingURL=cli.js.map