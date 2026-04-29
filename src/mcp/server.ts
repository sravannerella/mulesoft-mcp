import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { logger } from '../utils/logger.js';
import type { AppContainer } from '../container.js';

import { registerDesignCenterTools } from './tools/design-center.tools.js';
import { registerRuntimeManagerTools } from './tools/runtime-manager.tools.js';
import { registerExchangeTools } from './tools/exchange.tools.js';
import { registerApiManagerTools } from './tools/api-manager.tools.js';
import { registerAccountTools } from './tools/account.tools.js';

export async function createMcpServer(container: AppContainer): Promise<void> {
  const server = new McpServer({
    name: 'mulesoft-mcp',
    version: '1.0.0',
  });

  // ── Register all domain tools ────────────────────────────────────────────
  registerDesignCenterTools(server, container.designCenter);
  registerRuntimeManagerTools(server, container.runtimeManager);
  registerExchangeTools(server, container.exchange);
  registerApiManagerTools(server, container.apiManager);
  registerAccountTools(server, container.account);

  // ── Connect via stdio transport ──────────────────────────────────────────
  const transport = new StdioServerTransport();

  logger.info('MCP server starting — connecting via stdio');
  await server.connect(transport);
  logger.info('MCP server connected and ready');
}
