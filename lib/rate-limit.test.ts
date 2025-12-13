/**
 * Tests for Rate Limit Module
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  recordFailedAttempt,
  clearAttempts,
  clearAllRateLimits,
  getRateLimitStats,
} from "@/lib/rate-limit";

beforeEach(() => {
  clearAllRateLimits();
});

describe("checkRateLimit", () => {
  it("should allow requests from new IPs", () => {
    const result = checkRateLimit("192.168.1.1");
    
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);
    expect(result.resetIn).toBe(0);
  });

  it("should track failed attempts", () => {
    const ip = "192.168.1.2";
    
    recordFailedAttempt(ip);
    recordFailedAttempt(ip);
    recordFailedAttempt(ip);
    
    const result = checkRateLimit(ip);
    
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("should block after max attempts", () => {
    const ip = "192.168.1.3";
    
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt(ip);
    }
    
    const result = checkRateLimit(ip);
    
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.resetIn).toBeGreaterThan(0);
  });
});

describe("clearAttempts", () => {
  it("should clear attempts for specific IP", () => {
    const ip = "192.168.1.4";
    
    recordFailedAttempt(ip);
    recordFailedAttempt(ip);
    recordFailedAttempt(ip);
    
    clearAttempts(ip);
    
    const result = checkRateLimit(ip);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);
  });
});

describe("getRateLimitStats", () => {
  it("should track IPs being monitored", () => {
    recordFailedAttempt("10.0.0.1");
    recordFailedAttempt("10.0.0.2");
    
    const stats = getRateLimitStats();
    
    expect(stats.totalTracked).toBe(2);
    expect(stats.ips).toContain("10.0.0.1");
    expect(stats.ips).toContain("10.0.0.2");
  });
});

describe("clearAllRateLimits", () => {
  it("should clear all tracked IPs", () => {
    recordFailedAttempt("1.1.1.1");
    recordFailedAttempt("2.2.2.2");
    
    clearAllRateLimits();
    
    const stats = getRateLimitStats();
    expect(stats.totalTracked).toBe(0);
  });
});

describe("custom limits", () => {
  it("should respect custom max attempts", () => {
    const ip = "192.168.1.5";
    
    recordFailedAttempt(ip);
    recordFailedAttempt(ip);
    recordFailedAttempt(ip);
    
    // With maxAttempts=3, should be blocked
    const result = checkRateLimit(ip, 3);
    expect(result.allowed).toBe(false);
    
    // With maxAttempts=5, should still be allowed
    const result2 = checkRateLimit(ip, 5);
    expect(result2.allowed).toBe(true);
  });
});
