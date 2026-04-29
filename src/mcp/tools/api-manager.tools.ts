import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ApiManagerService } from '../../services/api-manager.service.js';
import { formatError } from '../../utils/errors.js';

function ok(data: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function err(error: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: JSON.stringify(formatError(error), null, 2) }] };
}

export function registerApiManagerTools(
  server: McpServer,
  svc: ApiManagerService,
): void {
  server.tool(
    'api_manager_list_apis',
    'List all API instances in API Manager.',
    {
      environment: z.string().optional().describe('Environment name (overrides ANYPOINT_ENV_ID from config)'),
    },
    async ({ environment }) => {
      try { return ok(await svc.listApis(environment)); } catch (e) { return err(e); }
    },
  );

  server.tool(
    'api_manager_describe_api',
    'Get details for a specific API Manager API instance.',
    {
      apiId: z.string().min(1).describe('API instance ID'),
      environment: z.string().optional().describe('Environment name (overrides ANYPOINT_ENV_ID from config)'),
    },
    async ({ apiId, environment }) => {
      try { return ok(await svc.describeApi(apiId, environment)); } catch (e) { return err(e); }
    },
  );

  server.tool(
    'api_manager_manage_api',
    'Add an Exchange asset as a managed API instance in API Manager.',
    {
      assetGroupId: z.string().min(1).describe('Exchange asset group ID'),
      assetId: z.string().min(1).describe('Exchange asset ID'),
      assetVersion: z.string().min(1).describe('Exchange asset version'),
      environment: z.string().optional().describe('Environment name (overrides ANYPOINT_ENV_ID from config)'),
    },
    async ({ assetGroupId, assetId, assetVersion, environment }) => {
      try {
        return ok(await svc.manageApi(assetGroupId, assetId, assetVersion, environment));
      } catch (e) {
        return err(e);
      }
    },
  );

  // server.tool('api_manager_delete_api', ...) // disabled

  server.tool(
    'api_manager_list_policies',
    'List all policies applied to an API Manager API instance.',
    {
      apiId: z.string().min(1).describe('API instance ID'),
      environment: z.string().optional().describe('Environment name (overrides ANYPOINT_ENV_ID from config)'),
    },
    async ({ apiId, environment }) => {
      try { return ok(await svc.listPolicies(apiId, environment)); } catch (e) { return err(e); }
    },
  );

  server.tool(
    'api_manager_apply_policy',
    'Apply a policy to an API Manager API instance.',
    {
      apiId: z.string().min(1).describe('API instance ID'),
      policyId: z.string().min(1).describe('Policy template ID'),
      policyVersion: z.string().min(1).describe('Policy template version'),
      config: z
        .record(z.unknown())
        .default({})
        .describe('Policy configuration as a JSON object'),
      environment: z.string().optional().describe('Environment name (overrides ANYPOINT_ENV_ID from config)'),
    },
    async ({ apiId, policyId, policyVersion, config, environment }) => {
      try {
        return ok(await svc.applyPolicy(apiId, policyId, policyVersion, config, environment));
      } catch (e) {
        return err(e);
      }
    },
  );

  server.tool(
    'api_manager_unapply_policy',
    'Remove an applied policy from an API Manager API instance.',
    {
      apiId: z.string().min(1),
      policyId: z.string().min(1),
      environment: z.string().optional().describe('Environment name (overrides ANYPOINT_ENV_ID from config)'),
    },
    async ({ apiId, policyId, environment }) => {
      try { return ok(await svc.unapplyPolicy(apiId, policyId, environment)); } catch (e) { return err(e); }
    },
  );

  server.tool(
    'api_manager_list_contracts',
    'List all contracts (client applications) for an API instance.',
    {
      apiId: z.string().min(1),
      environment: z.string().optional().describe('Environment name (overrides ANYPOINT_ENV_ID from config)'),
    },
    async ({ apiId, environment }) => {
      try { return ok(await svc.listContracts(apiId, environment)); } catch (e) { return err(e); }
    },
  );
}
