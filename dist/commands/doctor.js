import fs from 'node:fs';
import { symbols, colors } from '../core/terminal.js';
import { ProcessRunner } from '../services/process-runner.js';
import { GitService } from '../services/git.js';
import { ProjectDiscoveryService } from '../services/project-discovery.js';
import { getProjectConfigPath, getUserConfigPath } from '../core/config.js';
export const doctorCommand = {
    name: 'doctor',
    description: 'Diagnose local development environment, tools, and DevKit configuration',
    usage: 'devkit doctor [options]',
    interactive: true,
    category: 'diagnostics',
    options: [
        {
            flags: '--verbose',
            description: 'Show detailed diagnostic information',
        },
    ],
    action: async (ctx) => {
        const results = [];
        const logger = ctx.logger;
        logger.info(colors.bold('\nDevKit Environment Diagnostics\n'));
        // 1. Node.js version check
        const currentVersion = process.version;
        const major = Number.parseInt(currentVersion.replace(/^v/, '').split('.')[0] || '0', 10);
        if (major >= 20) {
            results.push({
                category: 'Runtime',
                name: 'Node.js Version',
                status: 'ok',
                message: `${currentVersion} (Meets >= 20 LTS requirement)`,
            });
        }
        else {
            results.push({
                category: 'Runtime',
                name: 'Node.js Version',
                status: 'fail',
                message: `${currentVersion} is older than recommended Node.js 20+ LTS`,
                remediation: 'Upgrade to Node.js LTS (v20 or v22) from https://nodejs.org/',
            });
        }
        // 2. Git check
        const gitAvailable = await GitService.isGitAvailable(ctx.cancellationToken);
        if (gitAvailable) {
            try {
                const gitVer = await ProcessRunner.run('git', ['--version'], {
                    timeoutMs: 3000,
                    cancellationToken: ctx.cancellationToken,
                });
                results.push({
                    category: 'Tools',
                    name: 'Git Version Control',
                    status: 'ok',
                    message: gitVer.stdout.trim(),
                });
            }
            catch {
                results.push({
                    category: 'Tools',
                    name: 'Git Version Control',
                    status: 'ok',
                    message: 'Installed and available',
                });
            }
        }
        else {
            results.push({
                category: 'Tools',
                name: 'Git Version Control',
                status: 'warn',
                message: 'Git executable not found in PATH',
                remediation: 'Install Git for version control features: https://git-scm.com/',
            });
        }
        // 3. Package managers check
        const pkgManagers = ['npm', 'pnpm', 'yarn', 'bun'];
        const foundManagers = [];
        for (const pm of pkgManagers) {
            try {
                const res = await ProcessRunner.run(pm, ['--version'], {
                    timeoutMs: 3000,
                    cancellationToken: ctx.cancellationToken,
                });
                if (res.exitCode === 0) {
                    foundManagers.push(`${pm} (${res.stdout.trim()})`);
                }
            }
            catch {
                // Not installed, ignore
            }
        }
        if (foundManagers.length > 0) {
            results.push({
                category: 'Tools',
                name: 'Package Managers',
                status: 'ok',
                message: foundManagers.join(', '),
            });
        }
        else {
            results.push({
                category: 'Tools',
                name: 'Package Managers',
                status: 'warn',
                message: 'No supported package manager detected on PATH',
            });
        }
        // 4. Project context check
        const project = ProjectDiscoveryService.detect(ctx.projectRoot);
        if (project.type !== 'unknown') {
            results.push({
                category: 'Project',
                name: 'Workspace Context',
                status: 'ok',
                message: `Detected ${project.language || project.type} project: "${project.name}" (Git: ${project.isGitRepo ? 'Yes' : 'No'})`,
            });
        }
        else {
            results.push({
                category: 'Project',
                name: 'Workspace Context',
                status: 'ok',
                message: `Directory accessible: ${ctx.projectRoot} (No specific framework marker)`,
            });
        }
        // Check project directory write permissions
        try {
            const testFile = `${ctx.projectRoot}/.devkit-doctor-test-${Date.now()}`;
            fs.writeFileSync(testFile, 'test', 'utf-8');
            fs.unlinkSync(testFile);
            results.push({
                category: 'Filesystem',
                name: 'Project Directory Permissions',
                status: 'ok',
                message: 'Read/Write access confirmed',
            });
        }
        catch {
            results.push({
                category: 'Filesystem',
                name: 'Project Directory Permissions',
                status: 'fail',
                message: 'Cannot write to project directory',
                remediation: 'Ensure current user has write permissions in the workspace directory.',
            });
        }
        // 5. Configuration validity
        const projConfig = getProjectConfigPath(ctx.projectRoot);
        const userConfig = getUserConfigPath();
        results.push({
            category: 'Configuration',
            name: 'Project Config',
            status: 'ok',
            message: projConfig
                ? `Loaded from ${projConfig}`
                : 'Using default/user settings (no local .devkitrc.json)',
        });
        results.push({
            category: 'Configuration',
            name: 'User Config',
            status: 'ok',
            message: fs.existsSync(userConfig)
                ? `Active at ${userConfig}`
                : 'No user config file (using defaults)',
        });
        // 6. AI Provider Status (Optional feature)
        if (ctx.config.ai.provider === 'mock') {
            results.push({
                category: 'AI Features',
                name: 'Provider Integration',
                status: 'ok',
                message: 'Configured in local mock/offline mode (zero external telemetry)',
            });
        }
        else if (ctx.config.ai.apiKey) {
            results.push({
                category: 'AI Features',
                name: 'Provider Integration',
                status: 'ok',
                message: `Configured with provider "${ctx.config.ai.provider}" (API key configured)`,
            });
        }
        else {
            results.push({
                category: 'AI Features',
                name: 'Provider Integration',
                status: 'warn',
                message: `Provider "${ctx.config.ai.provider}" selected but no API key configured`,
                remediation: 'Set DEVKIT_AI_API_KEY environment variable to enable live AI features.',
            });
        }
        // Render results
        let hasFailures = false;
        for (const res of results) {
            let icon = colors.green(symbols.check);
            if (res.status === 'warn') {
                icon = colors.yellow(symbols.warning);
            }
            else if (res.status === 'fail') {
                icon = colors.red(symbols.cross);
                hasFailures = true;
            }
            logger.info(`  ${icon} ${colors.bold(res.name.padEnd(30))} ${res.message}`);
            if (res.remediation && (res.status === 'fail' || ctx.options['verbose'])) {
                logger.info(`    ${colors.dim('Fix:')} ${colors.cyan(res.remediation)}`);
            }
        }
        logger.info('');
        if (hasFailures) {
            logger.error('Diagnostic check found critical issues that need attention.');
            return 1;
        }
        logger.success('All essential environment checks passed.');
        return 0;
    },
};
//# sourceMappingURL=doctor.js.map