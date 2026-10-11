import { type CommandDefinition, type ExecutionContext } from '../core/command-registry.js';
import { GitService } from '../services/git.js';
import { createAIProvider } from '../ai/provider.js';
import { colors, symbols } from '../core/terminal.js';
import { GitError } from '../core/errors.js';

export const reviewCommand: CommandDefinition = {
  name: 'review',
  description: 'Inspect uncommitted git changes and generate code review summary',
  usage: 'devkit review [options]',
  interactive: true,
  category: 'git',
  options: [
    {
      flags: '--staged',
      description: 'Review staged changes only',
    },
    {
      flags: '--ai',
      description: 'Generate AI-assisted code review assessment',
    },
  ],
  action: async (ctx: ExecutionContext): Promise<number> => {
    const logger = ctx.logger;
    const isStagedOnly = Boolean(ctx.options['staged']);
    const requestedAi = Boolean(ctx.options['ai']);

    const isRepo = await GitService.isRepository(ctx.projectRoot, ctx.cancellationToken);
    if (!isRepo) {
      throw new GitError(
        'Current directory is not a Git repository.',
        'Initialize git with "git init" or navigate to an existing repository.',
      );
    }

    const status = await GitService.getStatus(ctx.projectRoot, ctx.cancellationToken);
    logger.info(colors.bold(`\nGit Review: Branch "${status.branch || 'detached'}"`));
    logger.info(`  ${symbols.bullet} Staged files: ${status.stagedCount}`);
    logger.info(`  ${symbols.bullet} Unstaged files: ${status.unstagedCount}`);
    logger.info(`  ${symbols.bullet} Untracked files: ${status.untrackedCount}`);

    if (status.files.length === 0) {
      logger.success('\nWorking directory is clean. No uncommitted changes found to review.');
      return 0;
    }

    logger.info(colors.bold('\nChanged Files:'));
    for (const f of status.files.slice(0, 30)) {
      const stateBadge = f.staged ? colors.green('[staged]') : colors.yellow('[unstaged]');
      logger.info(`  ${stateBadge} ${f.path} (${f.indexStatus}${f.workingTreeStatus})`);
    }

    if (status.files.length > 30) {
      logger.info(colors.dim(`  ... and ${status.files.length - 30} more files`));
    }

    // Inspect diff
    const diff = await GitService.getDiff(ctx.projectRoot, {
      staged: isStagedOnly,
      cancellationToken: ctx.cancellationToken,
      maxBytes: 1024 * 100, // 100 KB diff limit for terminal review
    });

    if (!diff || diff.trim().length === 0) {
      logger.info(colors.dim('\nNo line diffs detected in selected scope.'));
      return 0;
    }

    const diffLines = diff.split('\n');
    let additions = 0;
    let deletions = 0;
    for (const line of diffLines) {
      if (line.startsWith('+') && !line.startsWith('+++')) additions++;
      if (line.startsWith('-') && !line.startsWith('---')) deletions++;
    }

    logger.info(
      colors.bold(
        `\nDiff Stats: ${colors.green(`+${additions}`)} ${colors.red(`-${deletions}`)} lines`,
      ),
    );

    // AI-assisted review if requested or enabled
    if (requestedAi || ctx.config.ai.provider !== 'mock') {
      const provider = createAIProvider(ctx.config);
      if (provider.isConfigured() || ctx.config.ai.provider === 'mock') {
        logger.info(colors.dim(`\nRunning AI review using [${provider.name}]...`));

        const prompt = [
          `Review the following Git changes (additions: +${additions}, deletions: -${deletions}):`,
          'Focus on:',
          '1. Potential bugs, security vulnerabilities, or regression risks',
          '2. Code style, readability, and API design',
          '3. Test coverage recommendations',
          '\nDiff:\n```diff\n' + diff.slice(0, 10000) + '\n```',
        ].join('\n');

        const response = await provider.complete(
          {
            messages: [
              {
                role: 'system',
                content:
                  'You are a senior staff engineer performing a rigorous, constructive code review.',
              },
              { role: 'user', content: prompt },
            ],
          },
          ctx.cancellationToken,
        );

        logger.info(colors.bold('\nReview Feedback:'));
        logger.info(response.text);
      } else {
        logger.warn(
          '\nAI review skipped: AI provider not configured with API key. Set DEVKIT_AI_API_KEY.',
        );
      }
    } else {
      logger.info(
        colors.dim(
          '\nTip: Run "devkit review --ai" to generate an automated review with your configured AI provider.',
        ),
      );
    }

    return 0;
  },
};
