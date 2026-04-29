interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class Cache {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTtlMs: number;

  constructor(ttlSeconds: number) {
    this.defaultTtlMs = ttlSeconds * 1_000;
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds?: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds ? ttlSeconds * 1_000 : this.defaultTtlMs),
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  /** Remove all keys that contain the given substring. */
  invalidatePattern(pattern: string): void {
    for (const key of this.store.keys()) {
      if (key.includes(pattern)) this.store.delete(key);
    }
  }

  clear(): void {
    this.store.clear();
  }
}

export async function withCache<T>(
  cache: Cache,
  key: string,
  fn: () => Promise<T>,
  ttlSeconds?: number,
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== undefined) return cached;
  const result = await fn();
  cache.set(key, result, ttlSeconds);
  return result;
}
