/**
 * Rate Limiter for Authentication Endpoints
 * Tracks failed attempts by IP to prevent brute force attacks
 */

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

// In-memory store for rate limiting
// In production, replace with Redis for multi-instance support
const attempts = new Map<string, AttemptRecord>();

// Configuration
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const CLEANUP_INTERVAL_MS = 60 * 1000; // Clean up expired entries every minute

/**
 * Check if an IP is rate limited
 */
export function checkRateLimit(
  ip: string,
  maxAttempts: number = DEFAULT_MAX_ATTEMPTS,
  windowMs: number = DEFAULT_WINDOW_MS
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = attempts.get(ip);
  
  if (!record) {
    return { allowed: true, remaining: maxAttempts, resetIn: 0 };
  }
  
  // Check if window has expired
  if (now - record.firstAttempt > windowMs) {
    attempts.delete(ip);
    return { allowed: true, remaining: maxAttempts, resetIn: 0 };
  }
  
  const remaining = Math.max(0, maxAttempts - record.count);
  const resetIn = Math.ceil((record.firstAttempt + windowMs - now) / 1000);
  
  return {
    allowed: record.count < maxAttempts,
    remaining,
    resetIn,
  };
}

/**
 * Record a failed attempt for an IP
 */
export function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const record = attempts.get(ip);
  
  if (record) {
    record.count += 1;
    record.lastAttempt = now;
  } else {
    attempts.set(ip, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    });
  }
}

/**
 * Clear all attempts for an IP (e.g., after successful login)
 */
export function clearAttempts(ip: string): void {
  attempts.delete(ip);
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // Take the first IP in the chain
    return forwarded.split(",")[0].trim();
  }
  
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  
  return "unknown";
}

/**
 * Get rate limit stats (for testing/monitoring)
 */
export function getRateLimitStats(): { totalTracked: number; ips: string[] } {
  return {
    totalTracked: attempts.size,
    ips: Array.from(attempts.keys()),
  };
}

/**
 * Clear all rate limit data (for testing)
 */
export function clearAllRateLimits(): void {
  attempts.clear();
}

// Periodic cleanup of expired entries
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of attempts.entries()) {
      if (now - record.firstAttempt > DEFAULT_WINDOW_MS) {
        attempts.delete(ip);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}
