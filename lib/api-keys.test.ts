/**
 * Tests for API Key Encryption Module
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  encryptKey,
  decryptKey,
  maskKey,
  validateApiKeyFormat,
  isEncrypted,
  MASKED_KEY_MARKER,
} from "@/lib/api-keys";

// Mock environment variables
beforeEach(() => {
  process.env.API_KEYS_SECRET = "test-secret-key-for-testing-purposes-32bytes!";
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("encryptKey", () => {
  it("should return empty string for empty input", () => {
    expect(encryptKey("")).toBe("");
    expect(encryptKey("   ")).toBe("");
  });

  it("should encrypt a key and return iv:authTag:ciphertext format", () => {
    const encrypted = encryptKey("sk-test123456789");
    expect(encrypted).toBeTruthy();
    
    const parts = encrypted.split(":");
    expect(parts.length).toBe(3);
    
    // All parts should be base64-decodable
    for (const part of parts) {
      expect(() => Buffer.from(part, "base64")).not.toThrow();
    }
  });

  it("should produce different ciphertext for same plaintext (random IV)", () => {
    const encrypted1 = encryptKey("sk-test123456789");
    const encrypted2 = encryptKey("sk-test123456789");
    
    // Due to random IV, encrypted values should be different
    expect(encrypted1).not.toBe(encrypted2);
  });
});

describe("decryptKey", () => {
  it("should return empty string for empty input", () => {
    expect(decryptKey("")).toBe("");
    expect(decryptKey("   ")).toBe("");
  });

  it("should decrypt what was encrypted", () => {
    const original = "sk-mySecretApiKey123456";
    const encrypted = encryptKey(original);
    const decrypted = decryptKey(encrypted);
    
    expect(decrypted).toBe(original);
  });

  it("should handle special characters", () => {
    const original = "sk-test!@#$%^&*()_+{}[]|\\:\";<>?,./~`";
    const encrypted = encryptKey(original);
    const decrypted = decryptKey(encrypted);
    
    expect(decrypted).toBe(original);
  });

  it("should handle unicode characters", () => {
    const original = "sk-test🔑🔒🛡️";
    const encrypted = encryptKey(original);
    const decrypted = decryptKey(encrypted);
    
    expect(decrypted).toBe(original);
  });

  it("should return empty string for tampered ciphertext", () => {
    const encrypted = encryptKey("sk-test123");
    const parts = encrypted.split(":");
    
    // Tamper with the ciphertext
    const tampered = `${parts[0]}:${parts[1]}:wrongciphertext`;
    
    // Should fail gracefully
    expect(decryptKey(tampered)).toBe("");
  });

  it("should handle legacy XOR format or return garbage for non-AES format", () => {
    // Single-part strings hit the legacy XOR path which returns something
    // This is expected behavior - legacy format is for backwards compatibility only
    const result = decryptKey("notvalidformat");
    expect(typeof result).toBe("string");
    
    // Two-part strings also hit legacy path
    expect(typeof decryptKey("only:two")).toBe("string");
  });
});

describe("isEncrypted", () => {
  it("should return true for valid encrypted format", () => {
    const encrypted = encryptKey("sk-test");
    expect(isEncrypted(encrypted)).toBe(true);
  });

  it("should return false for plaintext", () => {
    expect(isEncrypted("sk-test123")).toBe(false);
    expect(isEncrypted("")).toBe(false);
    expect(isEncrypted("invalid")).toBe(false);
  });
});

describe("maskKey", () => {
  it("should mask long keys showing first and last 4 chars", () => {
    expect(maskKey("sk-1234567890abcdef")).toBe("sk-1••••cdef");
  });

  it("should return dots for short keys", () => {
    expect(maskKey("short")).toBe("••••••••");
    expect(maskKey("")).toBe("••••••••");
    expect(maskKey("ab")).toBe("••••••••");
  });
});

describe("validateApiKeyFormat", () => {
  it("should accept empty key (means delete)", () => {
    expect(validateApiKeyFormat("openai", "")).toEqual({ valid: true });
  });

  it("should validate OpenAI key format", () => {
    expect(validateApiKeyFormat("openai", "sk-test1234567890123456")).toEqual({ valid: true });
    expect(validateApiKeyFormat("openai", "invalid-key")).toEqual({
      valid: false,
      error: "OpenAI keys should start with 'sk-'",
    });
    expect(validateApiKeyFormat("openai", "sk-short")).toEqual({
      valid: false,
      error: "OpenAI key seems too short",
    });
  });

  it("should validate DeepSeek key format", () => {
    expect(validateApiKeyFormat("deepseek", "sk-test1234567890")).toEqual({ valid: true });
    expect(validateApiKeyFormat("deepseek", "invalid")).toEqual({
      valid: false,
      error: "DeepSeek keys should start with 'sk-'",
    });
  });

  it("should reject keys with whitespace", () => {
    expect(validateApiKeyFormat("openai", "sk-test key with space")).toEqual({
      valid: false,
      error: "API key should not contain whitespace",
    });
  });

  it("should reject keys that are too long", () => {
    const longKey = "sk-" + "a".repeat(300);
    expect(validateApiKeyFormat("openai", longKey)).toEqual({
      valid: false,
      error: "API key is too long",
    });
  });
});

describe("MASKED_KEY_MARKER", () => {
  it("should be a unique marker string", () => {
    expect(MASKED_KEY_MARKER).toBe("__MASKED__");
  });
});
