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
    type: 'raml' | 'oas' | 'wsdl' | 'fragment' = 'raml',
  ): Promise<unknown> {
    this.cache.invalidatePattern('dc:');
    return this.cli.runCommand([
      'designcenter', 'project', 'create',
      '--name', name,
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
}
