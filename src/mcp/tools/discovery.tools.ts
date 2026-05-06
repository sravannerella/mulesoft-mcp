import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { AppContainer } from '../../container.js';
import { formatError } from '../../utils/errors.js';
import { executeGetAllApiInstances } from '../../scripts/get-all-api-instances.js';
import { executeIdentifyInsecureApis } from '../../scripts/identify-insecure-apis.js';
import { executeListAllApplications } from '../../scripts/list-all-applications.js';

function ok(data: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function err(error: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: JSON.stringify(formatError(error), null, 2) }] };
}

export function registerDiscoveryTools(server: McpServer, container: AppContainer): void {
  server.tool(
    'identify_insecure_apis',
    'Discovers deployed applications across on-prem, CloudHub 1.0, and CloudHub 2.0, maps them to API Manager instances, and reports instances with no applied policies.',
    {
      environment: z.string().optional().describe('Optional environment name filter. If omitted, scans all environments.'),
    },
    async ({ environment }) => {
      try {
        return ok(await executeIdentifyInsecureApis(container, environment));
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    'get_all_api_instances',
    'Retrieves API Manager instances across all environments, including instance details and associated applications. Optionally filter by environment.',
    {
      environment: z.string().optional().describe('Optional environment name filter. If omitted, scans all environments.'),
    },
    async ({ environment }) => {
      try {
        return ok(await executeGetAllApiInstances(container, environment));
      } catch (error) {
        return err(error);
      }
    },
  );

  server.tool(
    'list_all_applications',
    'Fetches applications deployed in on-prem, CloudHub 1.0, and CloudHub 2.0, along with associated API Manager instances. Optionally filter by environment.',
    {
      environment: z.string().optional().describe('Optional environment name filter. If omitted, scans all environments.'),
    },
    async ({ environment }) => {
      try {
        return ok(await executeListAllApplications(container, environment));
      } catch (error) {
        return err(error);
      }
    },
  );
}