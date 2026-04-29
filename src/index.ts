import { logger } from './utils/logger.js';
import { createContainer } from './container.js';
import { createMcpServer } from './mcp/server.js';

async function main(): Promise<void> {
  try {
    logger.info('Initialising MulesSoft MCP Server');

    const container = createContainer();

    await createMcpServer(container);
  } catch (error) {
    logger.error('Fatal error during startup', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

// Handle unhandled rejections gracefully
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message });
  process.exit(1);
});

await main();
