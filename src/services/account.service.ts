import { CLIService } from '../cli/cli-service.js';
import { Cache, withCache } from '../utils/cache.js';
import { env } from '../config/env.js';
import type { Environment, BusinessGroup, UserInfo } from '../types/index.js';

export class AccountService {
  private readonly cache: Cache;

  constructor(private readonly cli: CLIService) {
    this.cache = new Cache(env.CACHE_TTL_SECONDS);
  }

  // ── User ───────────────────────────────────────────────────────────────────

  describeUser(): Promise<UserInfo> {
    return withCache(this.cache, 'account:user', () =>
      this.cli.runCommand<UserInfo>(['account', 'user', 'describe'], undefined, { skipEnvironment: true }),
    );
  }

  // ── Business Groups ────────────────────────────────────────────────────────

  listBusinessGroups(): Promise<BusinessGroup[]> {
    return withCache(this.cache, 'account:bgs', () =>
      this.cli.runCommand<BusinessGroup[]>([
        'account', 'business-group', 'list',
      ], undefined, { skipEnvironment: true }),
    );
  }

  // ── Environments ───────────────────────────────────────────────────────────

  listEnvironments(): Promise<Environment[]> {
    return withCache(this.cache, 'account:envs', () =>
      this.cli.runCommand<Environment[]>(['account', 'environment', 'list'], undefined, { skipEnvironment: true }),
    );
  }

  describeEnvironment(name: string): Promise<Environment> {
    return withCache(this.cache, `account:env:${name}`, () =>
      this.cli.runCommand<Environment>([
        'account', 'environment', 'describe', name,
      ], undefined, { skipEnvironment: true }),
    );
  }

  async createEnvironment(
    name: string,
    type: 'sandbox' | 'production' = 'sandbox',
  ): Promise<unknown> {
    this.cache.invalidatePattern('account:env');
    return this.cli.runCommand([
      'account', 'environment', 'create',
      '--type', type,
      name,
    ], undefined, { skipEnvironment: true });
  }

  async deleteEnvironment(name: string): Promise<unknown> {
    this.cache.invalidatePattern('account:env');
    return this.cli.runCommand(['account', 'environment', 'delete', name], undefined, { skipEnvironment: true });
  }
}
