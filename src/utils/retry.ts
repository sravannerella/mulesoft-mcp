import { logger } from './logger.js';

export interface RetryOptions {
  maxRetries: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  isRetryable?: (error: unknown) => boolean;
}

const TRANSIENT_PATTERNS = [
  /ECONNRESET/i,
  /ETIMEDOUT/i,
  /ENOTFOUND/i,
  /timeout/i,
  /rate.?limit/i,
  /503/,
  /502/,
  /429/,
];

const defaultIsRetryable = (error: unknown): boolean =>
  error instanceof Error &&
  TRANSIENT_PATTERNS.some((p) => p.test(error.message));

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const {
    maxRetries,
    initialDelayMs = 500,
    maxDelayMs = 10_000,
    backoffFactor = 2,
    isRetryable = defaultIsRetryable,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !isRetryable(error)) {
        throw error;
      }

      const delay = Math.min(
        initialDelayMs * Math.pow(backoffFactor, attempt),
        maxDelayMs,
      );

      logger.warn('Command failed — retrying', {
        attempt: attempt + 1,
        maxRetries,
        delayMs: delay,
        error: error instanceof Error ? error.message : String(error),
      });

      await sleep(delay);
    }
  }

  throw lastError;
}
