import { TavilySearch } from "@langchain/tavily";
import { DynamicTool } from "@langchain/core/tools";
import { CacheWrapper, withCache, CachedResult } from "../lib/cache";
import { retry } from "../lib/retry";

// Cache wrapper with 5-minute TTL for search results
const searchCache = new CacheWrapper<CachedSearchResult>({ ttl: 300000 });

type CachedSearchResult = {
  query: string;
  results: any;
  cached: boolean;
  cacheTimestamp?: number;
};

// Raw search function (no caching)
async function performSearch(query: string): Promise<CachedSearchResult> {
  const searchTool = new TavilySearch({ maxResults: 5 });
  const result = await searchTool._call({ query });

  // Check for Tavily API errors
  if ("error" in result) {
    throw new Error(`Search failed: ${result.error}`);
  }

  return {
    query,
    results: result,
    cached: false,
  };
}

// Search with retry logic for transient errors
async function performSearchWithRetry(query: string): Promise<CachedSearchResult> {
  return retry(
    () => performSearch(query),
    {
      maxAttempts: 3,
      initialDelay: 1000,
      backoffMultiplier: 2,
      onRetry: (attempt, error, delay) => {
        console.log(`[WebSearch] Retry attempt ${attempt}/3 after ${Math.round(delay)}ms due to:`, error.message || error);
      },
    }
  );
}

// Wrap search function with caching and retry
const searchWithCache = withCache(searchCache, performSearchWithRetry);

// Helper to format cache age
function formatAge(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export const webSearch = new DynamicTool({
  name: "web_search",
  description: "Search the web for a given query to find factual information and research details.",
  func: async (query: string) => {
    // Validate query before proceeding
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return JSON.stringify({
        error: `Invalid query: must be at least 2 characters`,
        query: query || 'undefined',
      });
    }

    try {
      const cacheKey = JSON.stringify([query]);
      
      // Check cache BEFORE executing to determine hit/miss
      const cachedResult = await searchCache.get(cacheKey);
      const isCacheHit = cachedResult !== undefined;

      const result = await searchWithCache(query);

      const response = {
        query: result.query,
        results: result.results,
        cached: isCacheHit,
        cacheTimestamp: isCacheHit ? (cachedResult as any).timestamp : undefined,
        cacheAge: isCacheHit ? Date.now() - (cachedResult as any).timestamp : undefined,
        message: isCacheHit
          ? `[CACHE HIT] Showing cached results from ${formatAge(Date.now() - (cachedResult as any).timestamp)}`
          : `[CACHE MISS] Performed fresh web search`,
      };

      return JSON.stringify(response, null, 2);
    } catch (error: any) {
      return JSON.stringify({
        error: error.message || error,
        query: query,
      });
    }
  },
});
