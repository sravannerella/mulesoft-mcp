import { CLIService } from '../cli/cli-service.js';
import { Cache, withCache } from '../utils/cache.js';
import { env } from '../config/env.js';
import type { ApiManagerApi, ApiPolicy } from '../types/index.js';

export class ApiManagerService {
  private readonly cache: Cache;

  constructor(private readonly cli: CLIService) {
    this.cache = new Cache(env.CACHE_TTL_SECONDS);
  }

  // ── APIs ───────────────────────────────────────────────────────────────────

  listApis(environment?: string): Promise<ApiManagerApi[]> {
    return withCache(this.cache, `apim:apis:${environment ?? 'default'}`, () =>
      this.cli.runCommand<ApiManagerApi[]>(['api-mgr', 'api', 'list'], environment),
    );
  }

  describeApi(apiId: string, environment?: string): Promise<ApiManagerApi> {
    return withCache(this.cache, `apim:api:${apiId}:${environment ?? 'default'}`, () =>
      this.cli.runCommand<ApiManagerApi>(['api-mgr', 'api', 'describe', apiId], environment),
    );
  }

  async manageApi(
    assetGroupId: string,
    assetId: string,
    assetVersion: string,
    environment?: string,
  ): Promise<unknown> {
    this.cache.invalidatePattern('apim:');
    return this.cli.runCommand([
      'api-mgr', 'api', 'manage',
      assetGroupId, assetId, assetVersion,
    ], environment);
  }

  async deleteApi(apiId: string, environment?: string): Promise<unknown> {
    this.cache.invalidatePattern('apim:');
    return this.cli.runCommand(['api-mgr', 'api', 'delete', apiId], environment);
  }

  // ── Policies ───────────────────────────────────────────────────────────────

  listPolicies(apiId: string, environment?: string): Promise<ApiPolicy[]> {
    return withCache(this.cache, `apim:policies:${apiId}:${environment ?? 'default'}`, () =>
      this.cli.runCommand<ApiPolicy[]>(['api-mgr', 'policy', 'list', apiId], environment),
    );
  }

  async applyPolicy(
    apiId: string,
    policyId: string,
    policyVersion: string,
    config: Record<string, unknown>,
    environment?: string,
  ): Promise<unknown> {
    this.cache.invalidatePattern(`apim:policies:${apiId}`);
    return this.cli.runCommand([
      'api-mgr', 'policy', 'apply',
      '--policy-id', policyId,
      '--policy-version', policyVersion,
      '--config', JSON.stringify(config),
      apiId,
    ], environment);
  }

  async unapplyPolicy(apiId: string, policyId: string, environment?: string): Promise<unknown> {
    this.cache.invalidatePattern(`apim:policies:${apiId}`);
    return this.cli.runCommand([
      'api-mgr', 'policy', 'remove', apiId, policyId,
    ], environment);
  }

  // ── Contracts ────────────────────────────────────────────────────────────────

  listContracts(apiId: string, environment?: string): Promise<unknown[]> {
    return withCache(this.cache, `apim:contracts:${apiId}:${environment ?? 'default'}`, () =>
      this.cli.runCommand<unknown[]>([
        'api-mgr', 'contract', 'list', apiId,
      ], environment),
    );
  }
}
