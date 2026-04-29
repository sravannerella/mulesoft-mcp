import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { AccountService } from '../../services/account.service.js';
import { formatError } from '../../utils/errors.js';

function ok(data: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function err(error: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: JSON.stringify(formatError(error), null, 2) }] };
}

export function registerAccountTools(
  server: McpServer,
  svc: AccountService,
): void {
  server.tool(
    'account_describe_user',
    'Get details of the currently authenticated Anypoint user.',
    {},
    async () => {
      try { return ok(await svc.describeUser()); } catch (e) { return err(e); }
    },
  );

  server.tool(
    'account_list_business_groups',
    'List all accessible Anypoint business groups.',
    {},
    async () => {
      try { return ok(await svc.listBusinessGroups()); } catch (e) { return err(e); }
    },
  );

  server.tool(
    'account_list_environments',
    'List all environments in the configured organisation.',
    {},
    async () => {
      try { return ok(await svc.listEnvironments()); } catch (e) { return err(e); }
    },
  );

  server.tool(
    'account_describe_environment',
    'Get details of a specific environment.',
    { name: z.string().min(1).describe('Environment name') },
    async ({ name }) => {
      try { return ok(await svc.describeEnvironment(name)); } catch (e) { return err(e); }
    },
  );

  // server.tool('account_create_environment', ...) // disabled
  // server.tool('account_delete_environment', ...) // disabled
}
