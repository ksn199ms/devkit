import readline from 'node:readline';
import { type CommandDefinition, type ExecutionContext } from '../core/command-registry.js';
import { createAIProvider, type AIMessage } from '../ai/provider.js';
import { AIContextBuilder } from '../ai/context.js';
import { colors, symbols, renderMarkdown, TerminalSpinner } from '../core/terminal.js';
import { AIError } from '../core/errors.js';

export const chatCommand: CommandDefinition = {
  name: 'chat',
  description: 'Interactive terminal conversation with AI assistant aware of project context',
  usage: 'devkit chat [options]',
  interactive: true,
  category: 'ai',
  options: [
    {
      flags: '-m, --message <text>',
      description: 'Single-shot query message without opening interactive chat session',
    },
    {
      flags: '--stream',
      description: 'Stream raw response chunks without markdown formatting',
    },
  ],
  action: async (ctx: ExecutionContext): Promise<number> => {
    const logger = ctx.logger;
    const singleMessage = ctx.options['message'] as string | undefined;

    const provider = createAIProvider(ctx.config);
    if (!provider.isConfigured() && ctx.config.ai.provider !== 'mock') {
      throw new AIError(
        `AI provider "${ctx.config.ai.provider}" is not configured with an API key.`,
        {
          provider: ctx.config.ai.provider,
          remediation:
            'Set DEVKIT_AI_API_KEY environment variable or run in offline mode with "mock" provider.',
        },
      );
    }

    const context = await AIContextBuilder.buildContext({
      projectRoot: ctx.projectRoot,
      config: ctx.config,
    });

    let systemContext = `${context.systemPrompt}\n\nProject Context:\n${context.projectSummary}`;
    if (Object.keys(context.filesContent).length > 0) {
      systemContext += '\n\nProject Manifest & Inspected Files:';
      for (const [filePath, content] of Object.entries(context.filesContent)) {
        systemContext += `\n\n--- ${filePath} ---\n${content}\n`;
      }
    }

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: systemContext,
      },
    ];

    // Single message execution (Non-interactive mode)
    if (singleMessage) {
      messages.push({ role: 'user', content: singleMessage });
      if (ctx.options['stream'] === true) {
        await provider.stream(
          { messages, maxTokens: ctx.config.ai.maxTokens },
          (chunk) => process.stdout.write(chunk),
          ctx.cancellationToken,
        );
        process.stdout.write('\n');
      } else {
        const spinner = new TerminalSpinner('Generating response...');
        spinner.start();
        try {
          const res = await provider.complete(
            { messages, maxTokens: ctx.config.ai.maxTokens },
            ctx.cancellationToken,
          );
          spinner.stop(true);
          process.stdout.write(renderMarkdown(res.text));
          process.stdout.write('\n');
        } catch (err) {
          spinner.stop(true);
          throw err;
        }
      }
      return 0;
    }

    // Interactive conversational session
    logger.info(colors.bold(`\nDevKit Chat [Provider: ${provider.name}]`));
    logger.info(colors.dim('Type your question, or "exit" / Ctrl+C to quit.\n'));

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    const promptUser = (): Promise<string> => {
      return new Promise((resolve) => {
        rl.question(`${colors.cyan('devkit >')} `, (answer) => {
          resolve(answer.trim());
        });
      });
    };

    try {
      while (!ctx.cancellationToken.isCancellationRequested) {
        const input = await promptUser();
        if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
          break;
        }

        if (input.length === 0) continue;

        messages.push({ role: 'user', content: input });

        let assistantReply = '';
        if (ctx.options['stream'] === true) {
          process.stdout.write(`${colors.dim(symbols.arrow)} `);
          const res = await provider.stream(
            { messages, maxTokens: ctx.config.ai.maxTokens },
            (chunk) => {
              process.stdout.write(chunk);
              assistantReply += chunk;
            },
            ctx.cancellationToken,
          );
          assistantReply = res.text || assistantReply;
          process.stdout.write('\n\n');
        } else {
          const spinner = new TerminalSpinner('Thinking...');
          spinner.start();
          try {
            const res = await provider.complete(
              { messages, maxTokens: ctx.config.ai.maxTokens },
              ctx.cancellationToken,
            );
            spinner.stop(true);
            assistantReply = res.text;
            process.stdout.write(`\n${renderMarkdown(assistantReply)}\n\n`);
          } catch (err) {
            spinner.stop(true);
            throw err;
          }
        }

        messages.push({ role: 'assistant', content: assistantReply });
      }
    } finally {
      rl.close();
    }

    return 0;
  },
};
