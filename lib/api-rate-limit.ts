/**
 * API Rate Limiter with User Tiers
 * Provides different rate limits for anonymous vs authenticated users
 * Uses sliding window algorithm for more accurate rate limiting
 */

export interface RateLimitConfig {
  requests: number;
  windowMs: number;
}

export interface UserTierLimits {
  anonymous: RateLimitConfig;
  authenticated: RateLimitConfig;
}

// Default rate limits per minute
export const API_RATE_LIMITS: UserTierLimits = {
  anonymous: { 
    requests: 10, 
    windowMs: 60 * 1000 // 10 requests per minute
  },
  authenticated: { 
    requests: 30, 
    windowMs: 60 * 1000 // 30 requests per minute
  },
};

interface RateLimitEntry {
  timestamps: number[];
  lastCleanup: number;
}

// In-memory store for rate limiting
// In production, consider using Redis for distributed rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Sliding window rate limiter
 * More accurate than fixed window as it considers request timestamps
 */
export function checkApiRateLimit(
  identifier: string,
  config: RateLimitConfig = API_RATE_LIMITS.anonymous
): {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
  retryAfterMs: number | null;
} {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  let entry = rateLimitStore.get(identifier);
  
  if (!entry) {
    entry = { timestamps: [], lastCleanup: now };
    rateLimitStore.set(identifier, entry);
  }
  
  // Clean up old timestamps outside the window
  entry.timestamps = entry.timestamps.filter(ts => ts > windowStart);
  entry.lastCleanup = now;
  
  const currentCount = entry.timestamps.length;
  const remaining = Math.max(0, config.requests - currentCount);
  
  // Find when the oldest request in window will expire
  const oldestTimestamp = entry.timestamps[0];
  const resetInMs = oldestTimestamp 
    ? Math.max(0, (oldestTimestamp + config.windowMs) - now)
    : 0;
  
  if (currentCount >= config.requests) {
    return {
      allowed: false,
      remaining: 0,
      resetInMs,
      retryAfterMs: resetInMs,
    };
  }
  
  return {
    allowed: true,
    remaining: remaining - 1, // Account for current request
    resetInMs,
    retryAfterMs: null,
  };
}

/**
 * Record a request for rate limiting
 */
export function recordApiRequest(identifier: string): void {
  const now = Date.now();
  let entry = rateLimitStore.get(identifier);
  
  if (!entry) {
    entry = { timestamps: [], lastCleanup: now };
    rateLimitStore.set(identifier, entry);
  }
  
  entry.timestamps.push(now);
}

/**
 * Get the appropriate rate limit config based on authentication status
 */
export function getRateLimitForUser(isAuthenticated: boolean): RateLimitConfig {
  return isAuthenticated ? API_RATE_LIMITS.authenticated : API_RATE_LIMITS.anonymous;
}

/**
 * Create a unique identifier for rate limiting
 * Combines user ID (if authenticated) with IP for better tracking
 */
export function createRateLimitIdentifier(
  ip: string,
  userId?: string | null
): string {
  if (userId) {
    return `user:${userId}`;
  }
  return `ip:${ip}`;
}

/**
 * Get rate limit headers for API responses
 */
export function getRateLimitHeaders(
  remaining: number,
  resetInMs: number,
  limit: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': Math.max(0, remaining).toString(),
    'X-RateLimit-Reset': Math.ceil((Date.now() + resetInMs) / 1000).toString(),
  };
}

/**
 * Clear rate limit data for an identifier (for testing)
 */
export function clearApiRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Clear all rate limit data (for testing)
 */
export function clearAllApiRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Get stats about current rate limiting (for monitoring)
 */
export function getApiRateLimitStats(): {
  totalTracked: number;
  identifiers: string[];
} {
  return {
    totalTracked: rateLimitStore.size,
    identifiers: Array.from(rateLimitStore.keys()),
  };
}

// Periodic cleanup of old entries (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  const CLEANUP_INTERVAL = 5 * 60 * 1000;
  const MAX_ENTRY_AGE = 10 * 60 * 1000; // 10 minutes
  
  setInterval(() => {
    const now = Date.now();
    for (const [identifier, entry] of rateLimitStore.entries()) {
      // Remove entries that haven't been accessed in a while
      if (now - entry.lastCleanup > MAX_ENTRY_AGE) {
        rateLimitStore.delete(identifier);
      }
    }
  }, CLEANUP_INTERVAL);
}
