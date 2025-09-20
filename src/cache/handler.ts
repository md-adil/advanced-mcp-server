import { MemoryCache } from "../utils/memory-cache.ts";

export const cache = new MemoryCache();

// Individual cache functions
export function cacheSet(args: { key: string; value: string; ttl?: number }) {
  cache.set(args.key, args.value, args.ttl);
  return { success: true, key: args.key };
}

export function cacheGet(args: { key: string }) {
  const value = cache.get(args.key);
  return { found: value !== null, key: args.key, value };
}

export function cacheDelete(args: { key: string }) {
  const existed = cache.has(args.key);
  cache.delete(args.key);
  return { success: true, key: args.key, existed };
}
