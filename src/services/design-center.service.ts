import { CLIService } from '../cli/cli-service.js';
import { Cache, withCache } from '../utils/cache.js';
import { env } from '../config/env.js';
import type { DesignCenterProject } from '../types/index.js';

export class DesignCenterService {
  private readonly cache: Cache;

  constructor(private readonly cli: CLIService) {
    this.cache = new Cache(env.CACHE_TTL_SECONDS);
  }

  listProjects(): Promise<DesignCenterProject[]> {
    return withCache(this.cache, 'dc:projects', () =>
      this.cli.runCommand<DesignCenterProject[]>([
        'designcenter', 'project', 'list',
      ]),
    );
  }

  async createProject(
    name: string,
    type: 'raml' | 'oas' | 'raml-fragment' = 'raml',
  ): Promise<unknown> {
    this.cache.invalidatePattern('dc:');
    return this.cli.runCommand([
      'designcenter', 'project', 'create',
      name,
      '--type', type,
    ]);
  }

  async deleteProject(name: string): Promise<unknown> {
    this.cache.invalidatePattern('dc:');
    return this.cli.runCommand(['designcenter', 'project', 'delete', name]);
  }

  uploadProject(name: string, directory: string): Promise<unknown> {
    return this.cli.runCommand([
      'designcenter', 'project', 'upload',
      '--directory', directory,
      name,
    ]);
  }

  downloadProject(name: string, directory: string): Promise<unknown> {
    return this.cli.runCommand([
      'designcenter', 'project', 'download',
      '--directory', directory,
      name,
    ]);
  }

  async publishProject(
    name: string,
    options?: {
      assetId?: string;
      groupId?: string;
      version?: string;
      apiVersion?: string;
      main?: string;
      status?: string;
      branch?: string;
      projectName?: string;
    },
  ): Promise<unknown> {
    this.cache.invalidatePattern('dc:');
    const args = ['designcenter', 'project', 'publish', name];
    if (options?.assetId) args.push('--assetId', options.assetId);
    if (options?.groupId) args.push('--groupId', options.groupId);
    if (options?.version) args.push('--version', options.version);
    if (options?.apiVersion) args.push('--apiVersion', options.apiVersion);
    if (options?.main) args.push('--main', options.main);
    if (options?.status) args.push('--status', options.status);
    if (options?.branch) args.push('--branch', options.branch);
    if (options?.projectName) args.push('--name', options.projectName);
    return this.cli.runCommand(args, undefined, { skipGlobalArgs: true, skipEnvironment: true });
  }
}
