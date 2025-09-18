import { MemoryCache } from "../../utils/cache.ts";

// Individual cache functions
function cacheSet(cache: MemoryCache, args: { key: string; value: string; ttl?: number }) {
  cache.set(args.key, args.value, args.ttl);
  return { success: true, key: args.key };
}

function cacheGet(cache: MemoryCache, args: { key: string }) {
  const value = cache.get(args.key);
  return { found: value !== null, key: args.key, value };
}

function cacheDelete(cache: MemoryCache, args: { key: string }) {
  const existed = cache.has(args.key);
  cache.delete(args.key);
  return { success: true, key: args.key, existed };
}

// Main execution function - handles all cache tool cases
export function executeCacheTool(cache: MemoryCache, name: string, args: Record<string, unknown>) {
  switch (name) {
    case "cache_set":
      return cacheSet(cache, args as { key: string; value: string; ttl?: number });
    case "cache_get":
      return cacheGet(cache, args as { key: string });
    case "cache_delete":
      return cacheDelete(cache, args as { key: string });
    default:
      throw new Error(`Unknown cache tool: ${name}`);
  }
}