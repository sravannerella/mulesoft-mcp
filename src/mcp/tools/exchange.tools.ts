import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ExchangeService } from '../../services/exchange.service.js';
import { formatError } from '../../utils/errors.js';

function ok(data: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function err(error: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: JSON.stringify(formatError(error), null, 2) }] };
}

export function registerExchangeTools(
  server: McpServer,
  svc: ExchangeService,
): void {
  server.tool(
    'exchange_list_assets',
    'List Exchange assets with optional search and pagination.',
    {
      search: z.string().optional().describe('Full-text search query'),
      limit: z.number().int().min(1).max(100).default(25).describe('Page size'),
      offset: z.number().int().min(0).default(0).describe('Page offset'),
      organizationOnly: z
        .boolean()
        .default(false)
        .describe('When true, return only assets belonging to the configured organization'),
    },
    async ({ search, limit, offset, organizationOnly }) => {
      try {
        return ok(await svc.listAssets(search, { limit, offset }, organizationOnly));
      } catch (e) {
        return err(e);
      }
    },
  );

  server.tool(
    'exchange_get_asset',
    'Get details for a specific Exchange asset.',
    {
      groupId: z.string().min(1).optional().describe('Asset group ID (optional)'),
      assetId: z.string().min(1).describe('Asset ID'),
      version: z.string().min(1).describe('Asset version'),
    },
    async ({ groupId, assetId, version }) => {
      try {
        return ok(await svc.getAsset(groupId, assetId, version));
      } catch (e) {
        return err(e);
      }
    },
  );

  // server.tool('exchange_copy_asset', ...) // disabled
  // server.tool('exchange_delete_asset', ...) // disabled
}
