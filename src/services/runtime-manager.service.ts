import { CLIService } from '../cli/cli-service.js';
import { Cache, withCache } from '../utils/cache.js';
import { env } from '../config/env.js';
import type {
  RuntimeApplication,
  Server,
  Cluster,
  Application,
  CloudHubDeployOptions,
  CloudHub2Deployment,
  CloudHub2DeployOptions,
} from '../types/index.js';

export class RuntimeManagerService {
  private readonly cache: Cache;

  constructor(private readonly cli: CLIService) {
    this.cache = new Cache(env.CACHE_TTL_SECONDS);
  }

  // ── CloudHub 1.0 ───────────────────────────────────────────────────────────

  listCloudHubApplications(environment?: string): Promise<Application[]> {
    return withCache(this.cache, `ch:apps:${environment ?? 'default'}`, () =>
      this.cli.runCommand<Application[]>(['runtime-mgr', 'cloudhub-application', 'list'], environment),
    );
  }

  describeCloudHubApplication(name: string, environment?: string): Promise<Application> {
    return withCache(this.cache, `ch:app:${name}:${environment ?? 'default'}`, () =>
      this.cli.runCommand<Application>(['runtime-mgr', 'cloudhub-application', 'describe', name], environment),
    );
  }

  async deployCloudHubApplication(opts: CloudHubDeployOptions, environment?: string): Promise<unknown> {
    const args = ['runtime-mgr', 'cloudhub-application', 'deploy'];
    if (opts.runtimeVersion) args.push('--runtime', opts.runtimeVersion);
    if (opts.workers !== undefined) args.push('--workers', String(opts.workers));
    if (opts.workerSize) args.push('--workerSize', opts.workerSize);
    if (opts.region) args.push('--region', opts.region);
    if (opts.properties) {
      for (const [k, v] of Object.entries(opts.properties)) {
        args.push('--property', `${k}:${v}`);
      }
    }
    args.push(opts.name, opts.jarPath);
    this.cache.invalidatePattern('ch:');
    return this.cli.runCommand(args, environment);
  }

  async startCloudHubApplication(name: string, environment?: string): Promise<unknown> {
    this.cache.invalidatePattern('ch:app');
    return this.cli.runCommand(['runtime-mgr', 'cloudhub-application', 'start', name], environment);
  }

  async stopCloudHubApplication(name: string, environment?: string): Promise<unknown> {
    this.cache.invalidatePattern('ch:app');
    return this.cli.runCommand(['runtime-mgr', 'cloudhub-application', 'stop', name], environment);
  }

  async restartCloudHubApplication(name: string, environment?: string): Promise<unknown> {
    this.cache.invalidatePattern('ch:app');
    return this.cli.runCommand(['runtime-mgr', 'cloudhub-application', 'restart', name], environment);
  }

  async deleteCloudHubApplication(name: string, environment?: string): Promise<unknown> {
    this.cache.invalidatePattern('ch:');
    return this.cli.runCommand(['runtime-mgr', 'cloudhub-application', 'delete', name], environment);
  }

  // ── CloudHub 2.0 ───────────────────────────────────────────────────────────

  listCloudHub2Deployments(target?: string, environment?: string): Promise<CloudHub2Deployment[]> {
    const cacheKey = `ch2:deployments:${target ?? 'all'}:${environment ?? 'default'}`;
    const args = ['runtime-mgr', 'application', 'list'];
    if (target) args.push('--target', target);
    return withCache(this.cache, cacheKey, () =>
      this.cli.runCommand<CloudHub2Deployment[]>(args, environment),
    );
  }

  describeCloudHub2Deployment(name: string, environment?: string): Promise<CloudHub2Deployment> {
    return withCache(this.cache, `ch2:deployment:${name}:${environment ?? 'default'}`, () =>
      this.cli.runCommand<CloudHub2Deployment>(['runtime-mgr', 'application', 'describe', name], environment),
    );
  }

  async deployCloudHub2Application(opts: CloudHub2DeployOptions, environment?: string): Promise<unknown> {
    const args = [
      'runtime-mgr', 'application', 'deploy',
      opts.name, opts.target, opts.runtimeVersion ?? '', opts.artifactId,
    ];
    if (opts.replicas !== undefined) args.push('--replicas', String(opts.replicas));
    if (opts.replicaSize) args.push('--replicaSize', opts.replicaSize);
    this.cache.invalidatePattern('ch2:');
    return this.cli.runCommand(args, environment);
  }

  async deleteCloudHub2Deployment(name: string, environment?: string): Promise<unknown> {
    this.cache.invalidatePattern('ch2:');
    return this.cli.runCommand(['runtime-mgr', 'application', 'delete', name], environment);
  }

  listRuntimeFabrics(): Promise<unknown[]> {
    return withCache(this.cache, 'ch2:rtf', () =>
      this.cli.runCommand<unknown[]>(['runtime-mgr', 'rtf', 'list']),
    );
  }

  // ── Standalone Applications ────────────────────────────────────────────────

  listApplications(limit = 100, offset = 0, sort?: string, environment?: string): Promise<RuntimeApplication[]> {
    const cacheKey = `rtm:apps:${limit}:${offset}:${sort ?? ''}:${environment ?? 'default'}`;
    const args = [
      'runtime-mgr', 'standalone-application', 'list',
      '--limit', String(limit),
      '--offset', String(offset),
    ];
    if (sort) args.push('--sort', sort);
    return withCache(this.cache, cacheKey, () =>
      this.cli.runCommand<RuntimeApplication[]>(args, environment),
    );
  }

  describeApplication(name: string, environment?: string): Promise<RuntimeApplication> {
    return withCache(this.cache, `rtm:app:${name}:${environment ?? 'default'}`, () =>
      this.cli.runCommand<RuntimeApplication>([
        'runtime-mgr', 'standalone-application', 'describe', name,
      ], environment),
    );
  }

  async startApplication(name: string, environment?: string): Promise<unknown> {
    this.cache.invalidatePattern('rtm:app');
    return this.cli.runCommand(['runtime-mgr', 'standalone-application', 'start', name], environment);
  }

  async stopApplication(name: string, environment?: string): Promise<unknown> {
    this.cache.invalidatePattern('rtm:app');
    return this.cli.runCommand(['runtime-mgr', 'standalone-application', 'stop', name], environment);
  }

  async restartApplication(name: string, environment?: string): Promise<unknown> {
    this.cache.invalidatePattern('rtm:app');
    return this.cli.runCommand(['runtime-mgr', 'standalone-application', 'restart', name], environment);
  }

  async deleteApplication(name: string, environment?: string): Promise<unknown> {
    this.cache.invalidatePattern('rtm:');
    return this.cli.runCommand(['runtime-mgr', 'standalone-application', 'delete', name], environment);
  }

  // ── Servers ────────────────────────────────────────────────────────────────

  listServers(): Promise<Server[]> {
    return withCache(this.cache, 'rtm:servers', () =>
      this.cli.runCommand<Server[]>(['runtime-mgr', 'server', 'list']),
    );
  }

  describeServer(name: string): Promise<Server> {
    return withCache(this.cache, `rtm:server:${name}`, () =>
      this.cli.runCommand<Server>(['runtime-mgr', 'server', 'describe', name]),
    );
  }

  // ── Clusters ───────────────────────────────────────────────────────────────

  listClusters(): Promise<Cluster[]> {
    return withCache(this.cache, 'rtm:clusters', () =>
      this.cli.runCommand<Cluster[]>(['runtime-mgr', 'cluster', 'list']),
    );
  }

  describeCluster(name: string): Promise<Cluster> {
    return withCache(this.cache, `rtm:cluster:${name}`, () =>
      this.cli.runCommand<Cluster>([
        'runtime-mgr', 'cluster', 'describe', name,
      ]),
    );
  }
}
