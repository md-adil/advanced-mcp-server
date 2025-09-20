import { CacheEntry } from "../types.ts";

export class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private defaultTTL: number;

  constructor(defaultTTL = 3600) {
    this.defaultTTL = defaultTTL;
    this.startCleanupInterval();
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const expires = Date.now() + (ttl ?? this.defaultTTL) * 1000;
    this.cache.set(key, { data: value, expires });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  size(): number {
    return this.cache.size;
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: this.keys(),
      memoryUsage: JSON.stringify(this.cache).length,
    };
  }

  private startCleanupInterval() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expires) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Clean up every minute
  }
}
