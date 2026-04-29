/**
 * Token-bucket rate limiter.
 * Ensures at most `rps` requests are dispatched per second,
 * with a burst allowance equal to `rps` by default.
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly rps: number,
    private readonly burst: number = rps,
  ) {
    this.tokens = burst;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // Wait for the next token and retry.
    const waitMs = Math.ceil((1 / this.rps) * 1_000);
    await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
    return this.acquire();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1_000;
    this.tokens = Math.min(this.burst, this.tokens + elapsed * this.rps);
    this.lastRefill = now;
  }
}
