import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DesignCenterService } from '../../services/design-center.service.js';
import { formatError } from '../../utils/errors.js';

function ok(data: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function err(error: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: JSON.stringify(formatError(error), null, 2) }] };
}

export function registerDesignCenterTools(
  server: McpServer,
  svc: DesignCenterService,
): void {
  server.tool(
    'design_center_list_projects',
    'List all Design Center projects in the organisation.',
    {},
    async () => {
      try {
        return ok(await svc.listProjects());
      } catch (e) {
        return err(e);
      }
    },
  );

  server.tool(
    'design_center_create_project',
    'Create a new Design Center project.',
    {
      name: z.string().min(1).describe('Project name'),
      type: z
        .enum(['raml', 'oas', 'raml-fragment'])
        .default('raml')
        .describe('Project type'),
    },
    async ({ name, type }) => {
      try {
        return ok(await svc.createProject(name, type));
      } catch (e) {
        return err(e);
      }
    },
  );

  server.tool(
    'design_center_publish_project',
    'Publish a Design Center project to Exchange.',
    {
      name: z.string().min(1).describe('Project name'),
      assetId: z.string().optional().describe('The asset assetId'),
      groupId: z.string().optional().describe('The asset groupId (e.g., com.mulesoft.com)'),
      version: z.string().optional().describe('The asset version (e.g., 1.0.0)'),
      apiVersion: z.string().optional().describe('The API version for API specification projects'),
      main: z.string().optional().describe('The name of the main file'),
      status: z.string().optional().describe('The asset status'),
      branch: z.string().optional().describe('The project branch'),
      projectName: z.string().optional().describe('The name for the asset (if different from project name)'),
    },
    async ({ name, assetId, groupId, version, apiVersion, main, status, branch, projectName }) => {
      try {
        return ok(await svc.publishProject(name, {
          assetId,
          groupId,
          version,
          apiVersion,
          main,
          status,
          branch,
          projectName,
        }));
      } catch (e) {
        return err(e);
      }
    },
  );

  // server.tool('design_center_delete_project', ...) // disabled
  // server.tool('design_center_upload_project', ...) // disabled
  // server.tool('design_center_download_project', ...) // disabled
}
