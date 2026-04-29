import { execa } from 'execa';
import { env } from '../config/env.js';
import { logger, sanitizeArgs } from '../utils/logger.js';
import { AnypointCLIError, TimeoutError } from '../utils/errors.js';
import { withRetry } from '../utils/retry.js';
import type { RateLimiter } from '../utils/rate-limiter.js';

export interface CLIServiceConfig {
  timeoutMs: number;
  maxRetries: number;
}

export class CLIService {
  private readonly authEnv: NodeJS.ProcessEnv;
  private readonly globalArgs: string[];

  constructor(
    private readonly config: CLIServiceConfig,
    private readonly rateLimiter: RateLimiter,
  ) {
    this.authEnv = this.buildAuthEnv();
    this.globalArgs = this.buildGlobalArgs();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  async runCommand<T = unknown>(command: string[], environment?: string): Promise<T> {
    await this.rateLimiter.acquire();

    // Resolve environment: per-call override > .env default
    const resolvedEnv = environment ?? env.ANYPOINT_ENV_ID;
    const envArgs = resolvedEnv ? ['--environment', resolvedEnv] : [];
    const fullArgs = [...command, ...this.globalArgs, ...envArgs];
    const sanitized = sanitizeArgs(fullArgs);

    logger.debug('Executing Anypoint CLI', { command: sanitized });

    return withRetry(
      () => this.execute<T>(fullArgs, sanitized),
      { maxRetries: this.config.maxRetries },
    );
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async execute<T>(args: string[], sanitized: string[]): Promise<T> {
    try {
      const result = await execa('anypoint-cli-v4', args, {
        env: { ...process.env, ...this.authEnv },
        timeout: this.config.timeoutMs,
        reject: true,
        all: true,
      });

      logger.debug('CLI command succeeded', { command: sanitized });
      return this.parseOutput<T>(result.stdout, sanitized);
    } catch (error) {
      throw this.mapError(error, sanitized);
    }
  }

  private parseOutput<T>(stdout: string, command: string[]): T {
    const trimmed = stdout.trim();
    if (!trimmed) return [] as unknown as T;

    try {
      return JSON.parse(trimmed) as T;
    } catch {
      // A few CLI commands return plain-text success messages; surface them as-is.
      logger.debug('CLI output is not JSON — returning raw string', { command });
      return trimmed as unknown as T;
    }
  }

  private mapError(error: unknown, command: string[]): Error {
    if (!error || typeof error !== 'object') {
      return new AnypointCLIError(String(error), command);
    }

    const e = error as Record<string, unknown>;

    if (e['timedOut'] === true) {
      return new TimeoutError(
        `CLI command timed out after ${this.config.timeoutMs}ms`,
        this.config.timeoutMs,
      );
    }

    if ('exitCode' in e) {
      const stderr = typeof e['stderr'] === 'string' ? e['stderr'] : '';
      const message =
        stderr || (error instanceof Error ? error.message : 'CLI error');
      return new AnypointCLIError(
        message,
        command,
        typeof e['exitCode'] === 'number' ? e['exitCode'] : undefined,
        stderr,
      );
    }

    return error instanceof Error
      ? error
      : new AnypointCLIError(String(error), command);
  }

  private buildAuthEnv(): NodeJS.ProcessEnv {
    const auth: NodeJS.ProcessEnv = {
      // Always pass hostname-only; overrides any full URL that may be in process.env
      ANYPOINT_HOST: env.ANYPOINT_HOST,
    };
    if (env.ANYPOINT_USERNAME) auth['ANYPOINT_USERNAME'] = env.ANYPOINT_USERNAME;
    if (env.ANYPOINT_PASSWORD) auth['ANYPOINT_PASSWORD'] = env.ANYPOINT_PASSWORD;
    if (env.ANYPOINT_CLIENT_ID) auth['ANYPOINT_CLIENT_ID'] = env.ANYPOINT_CLIENT_ID;
    if (env.ANYPOINT_CLIENT_SECRET) auth['ANYPOINT_CLIENT_SECRET'] = env.ANYPOINT_CLIENT_SECRET;
    return auth;
  }

  private buildGlobalArgs(): string[] {
    const args: string[] = ['--output', 'json'];
    if (env.ANYPOINT_ORG_ID) args.push('--organization', env.ANYPOINT_ORG_ID);
    // Note: --environment is NOT included here; it is resolved per-call in runCommand()
    return args;
  }
}
