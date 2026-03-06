/**
 * Retry utility with exponential backoff for transient errors
 * 
 * Handles:
 * - Network timeouts (ETIMEDOUT, ECONNABORTED)
 * - Rate limits (HTTP 429)
 * - Server errors (HTTP 5xx)
 * 
 * Does NOT retry:
 * - Client errors (HTTP 400, 401, 403, 404)
 * - Permanent failures
 */

export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Initial delay in milliseconds before first retry */
  initialDelay: number;
  /** Maximum delay between retries (optional) */
  maxDelay?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Function to determine if error is retryable (optional) */
  retryOn?: (error: any) => boolean;
  /** Callback called before each retry (optional) */
  onRetry?: (attempt: number, error: any, delay: number) => void;
}

/**
 * Executes an async function with retry logic and exponential backoff
 * 
 * @param fn - Async function to execute
 * @param options - Retry configuration options
 * @returns Promise that resolves to the function result
 * 
 * @example
 * ```ts
 * const result = await retry(
 *   () => fetchApi(),
 *   {
 *     maxAttempts: 3,
 *     initialDelay: 1000,
 *     backoffMultiplier: 2,
 *     retryOn: (error) => error.status === 429 || error.status >= 500,
 *   }
 * );
 * ```
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    maxAttempts,
    initialDelay,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryOn: customRetryOn,
    onRetry,
  } = options;
  
  let lastError: Error = new Error('No error occurred');
  
  // Default retry logic: retry on rate limits, server errors, network timeouts
  const defaultRetryOn = (error: any): boolean => {
    // HTTP rate limits
    if (error?.status === 429) return true;
    
    // HTTP server errors
    if (error?.status && error.status >= 500) return true;
    
    // Network timeouts
    if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
      return true;
    }
    
   if (error?.code === 'ECONNREFUSED') return true;
    
    return false;
  };
  
  const shouldRetry = customRetryOn || defaultRetryOn;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error as Error;
      
      // Check if we should retry this error
      if (!shouldRetry(error)) {
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxAttempts) {
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
      const jitter = Math.random() * 100; // Add 0-100ms jitter to avoid thundering herd
      const delay = Math.min(exponentialDelay + jitter, maxDelay);
      
      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt, error, delay);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Creates a retry wrapper for a function with preset options
 * 
 * @param fn - Async function to wrap
 * @param options - Retry configuration options
 * @returns Wrapped function with retry logic
 * 
 * @example
 * ```ts
 * const searchWithRetry = createRetryWrapper(performSearch, {
 *   maxAttempts: 3,
 *   initialDelay: 1000,
 * });
 * 
 * const results = await searchWithRetry({ query: 'AI agents' });
 * ```
 */
export function createRetryWrapper<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: RetryOptions
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    return retry<R>(() => fn(...args), options);
  };
}
