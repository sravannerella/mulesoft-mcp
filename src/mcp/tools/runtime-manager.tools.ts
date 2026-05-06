import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { RuntimeManagerService } from '../../services/runtime-manager.service.js';
import { formatError } from '../../utils/errors.js';

function ok(data: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function err(error: unknown): { content: [{ type: 'text'; text: string }] } {
  return { content: [{ type: 'text', text: JSON.stringify(formatError(error), null, 2) }] };
}

export function registerRuntimeManagerTools(
  server: McpServer,
  svc: RuntimeManagerService,
): void {
  // ── CloudHub 1.0 (disabled) ───────────────────────────────────────────────

  // server.tool('cloudhub_list_applications', ...)
  // server.tool('cloudhub_describe_application', ...)
  // server.tool('cloudhub_deploy_application', ...)
  // server.tool('cloudhub_start_application', ...)
  // server.tool('cloudhub_stop_application', ...)
  // server.tool('cloudhub_restart_application', ...)
  // server.tool('cloudhub_delete_application', ...)

  // ── CloudHub 2.0 ──────────────────────────────────────────────────────────

  server.tool(
    'cloudhub2_list_deployments',
    'List all CloudHub 2.0 deployments.',
    {
      target: z.string().optional().describe('Filter by target (Shared Space or Private Space name)'),
      environment: z.string().optional().describe('Environment name (overrides ANYPOINT_ENV_NAME from config)'),
    },
    async ({ target, environment }) => {
      try { return ok(await svc.listCloudHub2Deployments(target, environment)); } catch (e) { return err(e); }
    },
  );

  server.tool(
    'cloudhub2_describe_deployment',
    'Get details for a specific CloudHub 2.0 deployment.',
    {
      name: z.string().min(1).describe('Deployment name'),
      environment: z.string().optional().describe('Environment name (overrides ANYPOINT_ENV_NAME from config)'),
    },
    async ({ name, environment }) => {
      try { return ok(await svc.describeCloudHub2Deployment(name, environment)); } catch (e) { return err(e); }
    },
  );

  server.tool(
    'cloudhub2_deploy_application',
    'Deploy a Mule application to CloudHub 2.0.',
    {
      name: z.string().min(1).describe('Deployment name'),
      artifactId: z.string().min(1).describe('Exchange artifactId of the application'),
      target: z.string().min(1).describe('Deployment target ID (Shared Space or Private Space)'),
      runtimeVersion: z.string().optional().describe('Mule runtime version, e.g. "4.6.0"'),
      replicas: z.number().int().min(1).optional().describe('Number of replicas'),
      replicaSize: z.string().optional().describe('Replica size in vCores, e.g. "0.1", "0.5", "1"'),
      environment: z.string().optional().describe('Environment name (overrides ANYPOINT_ENV_NAME from config)'),
    },
    async (opts) => {
      try { return ok(await svc.deployCloudHub2Application(opts, opts.environment)); } catch (e) { return err(e); }
    },
  );

  // server.tool('cloudhub2_delete_deployment', ...) // disabled

  server.tool(
    'cloudhub2_list_runtime_fabrics',
    'List available Runtime Fabric targets for CloudHub 2.0 deployments.',
    {},
    async () => {
      try { return ok(await svc.listRuntimeFabrics()); } catch (e) { return err(e); }
    },
  );

  // ── Standalone Applications ───────────────────────────────────────────────

  server.tool(
    'runtime_manager_list_applications',
    'List all applications in Runtime Manager (on-prem/hybrid standalone apps).',
    {
      limit: z.number().int().min(1).max(500).default(100).describe('Maximum number of results to return'),
      offset: z.number().int().min(0).default(0).describe('Pagination offset'),
      sort: z.string().optional().describe('Sort field, e.g. "name", "status"'),
      environment: z.string().optional().describe('Environment name (overrides ANYPOINT_ENV_NAME from config)'),
    },
    async ({ limit, offset, sort, environment }) => {
      try { return ok(await svc.listApplications(limit, offset, sort, environment)); } catch (e) { return err(e); }
    },
  );

  server.tool(
    'runtime_manager_describe_application',
    'Get details of a specific Runtime Manager application.',
    {
      name: z.string().min(1).describe('Application name'),
      environment: z.string().optional().describe('Environment name (overrides ANYPOINT_ENV_NAME from config)'),
    },
    async ({ name, environment }) => {
      try { return ok(await svc.describeApplication(name, environment)); } catch (e) { return err(e); }
    },
  );

  server.tool(
    'runtime_manager_start_application',
    'Start a Runtime Manager application.',
    {
      name: z.string().min(1),
      environment: z.string().optional().describe('Environment name (overrides ANYPOINT_ENV_NAME from config)'),
    },
    async ({ name, environment }) => {
      try { return ok(await svc.startApplication(name, environment)); } catch (e) { return err(e); }
    },
  );

  server.tool(
    'runtime_manager_stop_application',
    'Stop a Runtime Manager application.',
    {
      name: z.string().min(1),
      environment: z.string().optional().describe('Environment name (overrides ANYPOINT_ENV_NAME from config)'),
    },
    async ({ name, environment }) => {
      try { return ok(await svc.stopApplication(name, environment)); } catch (e) { return err(e); }
    },
  );

  server.tool(
    'runtime_manager_restart_application',
    'Restart a Runtime Manager application.',
    {
      name: z.string().min(1),
      environment: z.string().optional().describe('Environment name (overrides ANYPOINT_ENV_NAME from config)'),
    },
    async ({ name, environment }) => {
      try { return ok(await svc.restartApplication(name, environment)); } catch (e) { return err(e); }
    },
  );

  server.tool(
    'runtime_manager_delete_application',
    'Delete a Runtime Manager application.',
    {
      name: z.string().min(1),
      environment: z.string().optional().describe('Environment name (overrides ANYPOINT_ENV_NAME from config)'),
    },
    async ({ name, environment }) => {
      try { return ok(await svc.deleteApplication(name, environment)); } catch (e) { return err(e); }
    },
  );

  // ── Servers ────────────────────────────────────────────────────────────────

  server.tool(
    'runtime_manager_list_servers',
    'List all registered Mule servers in Runtime Manager.',
    {},
    async () => {
      try { return ok(await svc.listServers()); } catch (e) { return err(e); }
    },
  );

  server.tool(
    'runtime_manager_describe_server',
    'Get details of a specific Mule server.',
    { name: z.string().min(1).describe('Server name') },
    async ({ name }) => {
      try { return ok(await svc.describeServer(name)); } catch (e) { return err(e); }
    },
  );

  // ── Clusters ───────────────────────────────────────────────────────────────

  server.tool(
    'runtime_manager_list_clusters',
    'List all server clusters in Runtime Manager.',
    {},
    async () => {
      try { return ok(await svc.listClusters()); } catch (e) { return err(e); }
    },
  );

  server.tool(
    'runtime_manager_describe_cluster',
    'Get details of a specific server cluster.',
    { name: z.string().min(1).describe('Cluster name') },
    async ({ name }) => {
      try { return ok(await svc.describeCluster(name)); } catch (e) { return err(e); }
    },
  );
}
