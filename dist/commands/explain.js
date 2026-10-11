import path from 'node:path';
import { FileSystemService } from '../services/filesystem.js';
import { createAIProvider } from '../ai/provider.js';
import { AIContextBuilder } from '../ai/context.js';
import { colors, symbols, renderMarkdown, TerminalSpinner } from '../core/terminal.js';
import { ValidationError, FileSystemError } from '../core/errors.js';
export const explainCommand = {
    name: 'explain',
    description: 'Inspect a project file and generate architectural and code explanations',
    usage: 'devkit explain <file> [options]',
    interactive: true,
    category: 'ai',
    arguments: [
        {
            name: 'file',
            description: 'Path to the source file to inspect and explain',
            required: true,
        },
    ],
    options: [
        {
            flags: '--provider <name>',
            description: 'Override AI provider (mock, openai, anthropic, gemini)',
        },
        {
            flags: '--stream',
            description: 'Stream raw response chunks without markdown formatting',
        },
    ],
    action: async (ctx) => {
        const logger = ctx.logger;
        const targetFile = ctx.args[0];
        if (!targetFile) {
            throw new ValidationError('Missing required target file argument.', 'Usage: devkit explain <path/to/file>');
        }
        logger.info(colors.dim(`Inspecting file: ${targetFile}...`));
        // 1. Safe local filesystem check
        let fileData;
        try {
            fileData = await FileSystemService.readFile(targetFile, {
                projectRoot: ctx.projectRoot,
                allowExternalPaths: ctx.config.security.allowExternalPaths,
                maxFileSizeKb: ctx.config.security.maxFileSizeKb,
            });
        }
        catch (err) {
            if (err instanceof FileSystemError)
                throw err;
            throw new FileSystemError(`Unable to inspect file "${targetFile}".`, {
                path: targetFile,
                cause: err,
            });
        }
        const lines = fileData.content.split('\n');
        const relativePath = path.relative(ctx.projectRoot, fileData.path);
        logger.info(colors.bold(`\nFile Summary: ${relativePath}`));
        logger.info(`  ${symbols.bullet} Size: ${(fileData.sizeBytes / 1024).toFixed(1)} KB`);
        logger.info(`  ${symbols.bullet} Total Lines: ${lines.length}`);
        logger.info(`  ${symbols.bullet} Non-empty Lines: ${lines.filter((l) => l.trim().length > 0).length}`);
        // 2. AI Provider setup
        const provider = createAIProvider(ctx.config);
        if (!provider.isConfigured() && ctx.config.ai.provider !== 'mock') {
            logger.warn(`\nAI provider "${ctx.config.ai.provider}" is not configured with an API key.\n` +
                `To receive AI-generated code explanations, configure DEVKIT_AI_API_KEY:\n` +
                `  export DEVKIT_AI_API_KEY="your-api-key"`);
            return 0;
        }
        logger.info(colors.dim(`\nQuerying explanation via [${provider.name}]...`));
        const context = await AIContextBuilder.buildContext({
            projectRoot: ctx.projectRoot,
            config: ctx.config,
            includeFiles: [targetFile],
        });
        const prompt = [
            `Explain the following file from the project: ${relativePath}`,
            'Include:',
            '1. Responsibility and architectural role',
            '2. Key exported components / interfaces',
            '3. Potential edge cases, performance, or security considerations',
            '\nFile Content:\n```\n' + fileData.content.slice(0, 15000) + '\n```',
        ].join('\n');
        try {
            const messages = [
                { role: 'system', content: context.systemPrompt },
                { role: 'user', content: prompt },
            ];
            if (ctx.options['stream'] === true) {
                process.stdout.write('\n');
                await provider.stream({ messages, maxTokens: ctx.config.ai.maxTokens }, (chunk) => {
                    process.stdout.write(chunk);
                }, ctx.cancellationToken);
                process.stdout.write('\n\n');
            }
            else {
                const spinner = new TerminalSpinner('Analyzing and generating explanation...');
                spinner.start();
                try {
                    const response = await provider.complete({ messages, maxTokens: ctx.config.ai.maxTokens }, ctx.cancellationToken);
                    spinner.stop(true);
                    process.stdout.write(`\n${renderMarkdown(response.text)}\n\n`);
                }
                catch (err) {
                    spinner.stop(true);
                    throw err;
                }
            }
            return 0;
        }
        catch (err) {
            logger.error(`Failed to generate explanation: ${err.message}`);
            return 1;
        }
    },
};
//# sourceMappingURL=explain.js.map