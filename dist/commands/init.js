import fs from 'node:fs';
import path from 'node:path';
import { colors, symbols } from '../core/terminal.js';
import { ProjectDiscoveryService } from '../services/project-discovery.js';
export const initCommand = {
    name: 'init',
    description: 'Initialize DevKit workspace configuration in current project',
    usage: 'devkit init [options]',
    interactive: true,
    category: 'core',
    options: [
        {
            flags: '-f, --force',
            description: 'Overwrite existing configuration file if present',
        },
    ],
    action: async (ctx) => {
        const configPath = path.join(ctx.projectRoot, '.devkitrc.json');
        const logger = ctx.logger;
        if (fs.existsSync(configPath) && !ctx.options['force']) {
            logger.warn(`Configuration file already exists at ${configPath}. Use --force to overwrite.`);
            return 0;
        }
        const project = ProjectDiscoveryService.detect(ctx.projectRoot);
        logger.info(`Detected project: ${colors.bold(project.name)} (${project.type})`);
        const defaultConfig = {
            $schema: 'https://json.schemastore.org/devkit.json',
            appName: 'devkit',
            ai: {
                provider: 'gemini',
                model: 'gemini-flash-latest',
                temperature: 0.2,
            },
            security: {
                allowExternalPaths: false,
                maxFileSizeKb: 512,
                redactSecrets: true,
            },
            ui: {
                theme: 'default',
                interactive: true,
            },
        };
        try {
            fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2) + '\n', 'utf-8');
            logger.success(`Created project configuration at ${colors.cyan(configPath)}`);
            logger.info(`  ${symbols.bullet} Security: Project boundaries and secret redaction enabled`);
            logger.info(`  ${symbols.bullet} AI: Configured to Google Gemini (gemini-1.5-flash)`);
            logger.info(`  ${symbols.bullet} Ensure GEMINI_API_KEY or DEVKIT_AI_API_KEY environment variable is set`);
            return 0;
        }
        catch (err) {
            logger.error(`Failed to write configuration: ${err.message}`);
            return 1;
        }
    },
};
//# sourceMappingURL=init.js.map