// ─── Domain error types ───────────────────────────────────────────────────────

export class AnypointCLIError extends Error {
  constructor(
    message: string,
    public readonly command: string[],
    public readonly exitCode?: number,
    public readonly stderr?: string,
  ) {
    super(message);
    this.name = 'AnypointCLIError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class TimeoutError extends Error {
  constructor(
    message: string,
    public readonly timeoutMs: number,
  ) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends Error {
  constructor(message = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

// ─── Normalise any thrown value into a structured object ─────────────────────

export interface FormattedError {
  error: string;
  type: string;
  details?: unknown;
}

export function formatError(error: unknown): FormattedError {
  if (error instanceof AnypointCLIError) {
    return {
      error: error.message,
      type: error.name,
      details: { exitCode: error.exitCode, stderr: error.stderr },
    };
  }
  if (error instanceof Error) {
    return { error: error.message, type: error.name };
  }
  return { error: String(error), type: 'UnknownError' };
}
