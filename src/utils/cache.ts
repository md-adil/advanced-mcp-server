import Keyv from "keyv";
import KeyvSqlite from "@keyv/sqlite";
import { logger } from "../logger/index.ts";

export const HOUR = 3600;

// Global cache instance using SQLite
let globalMemoCache: Keyv | null = null;

function getGlobalMemoCache(): Keyv {
  if (!globalMemoCache) {
    const homeDir =
      Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || "/tmp";
    const cacheDir = `${homeDir}/.cache/advanced-mcp`;

    // Ensure cache directory exists
    try {
      Deno.mkdirSync(cacheDir, { recursive: true });
    } catch (error) {
      logger.warn("Failed to create memo cache directory", {
        error: String(error),
      });
    }

    const dbPath = `${cacheDir}/memorize.db`;
    logger.debug("Initializing SQLite memo cache", { dbPath });

    const store = new KeyvSqlite(dbPath);
    globalMemoCache = new Keyv({ store, namespace: "memorize" });

    globalMemoCache.on("error", (error) => {
      logger.error("Keyv memo cache error", { error: String(error) });
    });
  }

  return globalMemoCache;
}

// Generate cache key from function name and arguments
function generateMemoKey(functionName: string, args: unknown[]): string {
  const argsStr = JSON.stringify(args);
  const hash = btoa(argsStr)
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 32);
  return `${functionName}_${hash}`;
}

/**
 * Memorize function that caches results in SQLite using Keyv
 * Returns a function with the same TypeScript signature as the original
 *
 * @param cb - The function to memorize
 * @param ttl - Time to live in seconds (default: 3600)
 * @returns Memoized function with same signature
 */
export function memorize<T extends (...args: any[]) => any>(
  cb: T,
  ttl = 3600
): T {
  const cache = getGlobalMemoCache();
  const functionName = cb.name || "anonymous";

  // Universal memoized function that handles both sync and async
  const memoizedFunction = async (...args: Parameters<T>) => {
    const cacheKey = generateMemoKey(functionName, args);
    // Try to get from cache first
    const cached = await cache.get(cacheKey);
    if (cached !== undefined) {
      logger.debug("Memo cache hit", { functionName, cacheKey });
      return cached;
    }

    logger.debug("Memo cache miss", { functionName, cacheKey });

    // Execute the original function
    const result = await cb(...args);

    // Store in cache with TTL (convert seconds to milliseconds)
    await cache.set(cacheKey, result, ttl * 1000);
    logger.debug("Result memoized", { functionName, cacheKey, ttl });

    return result;
  };

  // Preserve function name and other properties
  Object.defineProperty(memoizedFunction, "name", {
    value: `memo_${functionName}`,
  });

  return memoizedFunction as T;
}

// Utility functions for memo cache management
export async function clearMemoCache(pattern?: string): Promise<void> {
  const cache = getGlobalMemoCache();

  if (pattern) {
    // Pattern-based clearing would require iterating through keys
    logger.info("Pattern-based memo cache clearing not implemented yet", {
      pattern,
    });
  } else {
    await cache.clear();
    logger.info("Memo cache cleared completely");
  }
}

export function getMemoStats(): {
  status: string;
  dbPath: string;
  namespace: string;
} {
  // Initialize cache to ensure it exists
  getGlobalMemoCache();

  const homeDir = Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || "/tmp";
  const dbPath = `${homeDir}/.cache/advanced-mcp/memorize.sqlite`;

  return {
    status: "active",
    dbPath,
    namespace: "memorize",
  };
}
