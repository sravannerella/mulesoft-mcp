import { CLIService } from '../cli/cli-service.js';
import { Cache, withCache } from '../utils/cache.js';
import { env } from '../config/env.js';
import type { ExchangeAsset, PaginationOptions } from '../types/index.js';

export class ExchangeService {
  private readonly cache: Cache;

  constructor(private readonly cli: CLIService) {
    this.cache = new Cache(env.CACHE_TTL_SECONDS);
  }

  listAssets(
    search?: string,
    pagination: PaginationOptions = {},
    organizationOnly = false,
  ): Promise<ExchangeAsset[]> {
    const { limit = 25, offset = 0 } = pagination;
    const cacheKey = `exchange:assets:${search ?? ''}:${limit}:${offset}:${organizationOnly}`;

    const args = [
      'exchange', 'asset', 'list',
      '--limit', String(limit),
      '--offset', String(offset),
    ];
    if (search) args.push('--search', search);
    if (organizationOnly) args.push('--organizationId', env.ANYPOINT_ORG_ID);

    return withCache(this.cache, cacheKey, () =>
      this.cli.runCommand<ExchangeAsset[]>(args),
    );
  }

  getAsset(groupId: string, assetId: string, version: string): Promise<ExchangeAsset> {
    return withCache(
      this.cache,
      `exchange:asset:${groupId}:${assetId}:${version}`,
      () =>
        this.cli.runCommand<ExchangeAsset>([
          'exchange', 'asset', 'describe', `${groupId}/${assetId}/${version}`,
        ]),
    );
  }

  async copyAsset(
    sourceGroupId: string,
    sourceAssetId: string,
    sourceVersion: string,
    targetAssetId: string,
    targetVersion: string,
  ): Promise<unknown> {
    this.cache.invalidatePattern('exchange:');
    return this.cli.runCommand([
      'exchange', 'asset', 'copy',
      `${sourceGroupId}/${sourceAssetId}/${sourceVersion}`,
      `${targetAssetId}/${targetVersion}`,
    ]);
  }

  async deleteAsset(
    groupId: string,
    assetId: string,
    version: string,
  ): Promise<unknown> {
    this.cache.invalidatePattern('exchange:');
    return this.cli.runCommand([
      'exchange', 'asset', 'delete', `${groupId}/${assetId}/${version}`,
    ]);
  }
}
