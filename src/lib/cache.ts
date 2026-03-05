import { InMemoryStore } from "@langchain/core/stores";

/**
 * Result cache type for storing cached responses with timestamp and validation
 */
export interface CachedResult<T> {
  results: T;
  timestamp: number;
}

/**
 * Options for cache behavior
 */
export interface CacheOptions {
  /** TTL for cache entries in milliseconds (optional) */
  ttl?: number;
}

/**
 * Cache wrapper class to handle generic caching for any tool
 * Uses InMemoryStore to cache function results and avoid redundant API calls
 */
export class CacheWrapper<T> {
  private store: InMemoryStore;
  private options: CacheOptions;

  constructor(options: CacheOptions = {}) {
    this.store = new InMemoryStore();
    this.options = options;
  }

  /**
   * Get cached value for a given key
   * Checks TTL if configured, returns undefined if cache is expired or not found
   */
  async get(key: string): Promise<T | undefined> {
    const cachedResults = await this.store.mget([key]);
    const cached = cachedResults[0] as CachedResult<T>;

    if (!cached) {
      return undefined;
    }

    // Check TTL if configured
    if (this.options.ttl && Date.now() - cached.timestamp > this.options.ttl) {
      // Cache expired, delete and return undefined
      await this.store.mdelete([key]);
      return undefined;
    }

    return cached.results;
  }

  /**
   * Set cached value for a given key
   * Includes timestamp for TTL checks
   */
  async set(key: string, value: T): Promise<void> {
    await this.store.mset([[key, { results: value, timestamp: Date.now() } as CachedResult<T>]]);
  }

  /**
   * Delete cached value for a given key
   */
  async delete(key: string): Promise<void> {
    await this.store.mdelete([key]);
  }

  /**
   * Clear all cached values
   */
  async clear(): Promise<void> {
    const keys = [];
    for await (const key of this.store.yieldKeys()) {
      keys.push(key);
    }
    if (keys.length > 0) {
      await this.store.mdelete(keys);
    }
  }
}

/**
 * Higher-order function that wraps any async function with caching
 * 
 * Usage:
 * ```ts
 * const searchCache = new CacheWrapper({ ttl: 300000 }); // 5 minutes
 * const cachedSearch = withCache(searchCache, async (query: string) => {
 *   // Your expensive operation here
 *   const results = await performSearch(query);
 *   return results;
 * });
 * ```
 * 
 * @param cache - CacheWrapper instance
 * @param fn - Async function to wrap with caching
 * @returns Wrapped function with caching behavior
 */
export function withCache<T extends any[], R>(
  cache: CacheWrapper<R>,
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    // Generate cache key from arguments (simple for now)
    const key = JSON.stringify(args);

    // Try to get cached value
    const cached = await cache.get(key);
    if (cached !== undefined) {
      console.log(`[Cache hit] for ${key.slice(0, 50)}...`);
      return cached;
    }

    // Cache miss - execute function
    console.log(`[Cache miss] for ${key.slice(0, 50)}...`);
    const result = await fn(...args);

    // Cache the result
    await cache.set(key, result);

    return result;
  };
}
