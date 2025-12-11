/**
 * Secure API Key Encryption Module
 * Uses AES-256-GCM for authenticated encryption
 */
import crypto from "crypto";

// Encryption constants
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const KEY_LENGTH = 32; // 256 bits

// Marker used to identify masked keys in form data
export const MASKED_KEY_MARKER = "__MASKED__";

/**
 * Get or derive a 32-byte encryption key from the secret
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.API_KEYS_SECRET || process.env.NEXTAUTH_SECRET;
  
  if (!secret) {
    throw new Error("API_KEYS_SECRET or NEXTAUTH_SECRET must be set");
  }
  
  // Use PBKDF2 to derive a consistent 256-bit key from the secret
  // Using a fixed salt since we need deterministic key derivation
  const salt = "groq-coder-api-keys-v2";
  return crypto.pbkdf2Sync(secret, salt, 100000, KEY_LENGTH, "sha256");
}

/**
 * Encrypt an API key using AES-256-GCM
 * Returns format: iv:authTag:ciphertext (all base64 encoded)
 */
export function encryptKey(key: string): string {
  if (!key || key.trim() === "") return "";
  
  const encryptionKey = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(key, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:ciphertext
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

/**
 * Decrypt an API key encrypted with AES-256-GCM
 * Handles both new format (iv:authTag:cipher) and legacy XOR format
 */
export function decryptKey(encrypted: string): string {
  if (!encrypted || encrypted.trim() === "") return "";
  
  // Check if it's the new format (contains 2 colons)
  const parts = encrypted.split(":");
  
  if (parts.length === 3) {
    // New AES-256-GCM format
    try {
      const encryptionKey = getEncryptionKey();
      const iv = Buffer.from(parts[0], "base64");
      const authTag = Buffer.from(parts[1], "base64");
      const ciphertext = Buffer.from(parts[2], "base64");
      
      const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv);
      decipher.setAuthTag(authTag);
      
      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);
      
      return decrypted.toString("utf8");
    } catch (error) {
      console.error("Decryption failed:", error);
      return "";
    }
  } else {
    // Legacy XOR format - attempt to decrypt for backwards compatibility
    try {
      const secret = process.env.API_KEYS_SECRET || process.env.NEXTAUTH_SECRET || "";
      const buffer = Buffer.from(encrypted, "base64");
      const secretBuffer = Buffer.from(secret);
      const decrypted = buffer.map((byte, i) => byte ^ secretBuffer[i % secretBuffer.length]);
      return Buffer.from(decrypted).toString("utf-8");
    } catch {
      return "";
    }
  }
}

/**
 * Check if a string is in the encrypted format (new AES-256-GCM)
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  const parts = value.split(":");
  return parts.length === 3 && parts.every(p => p.length > 0);
}

/**
 * Mask API key for display (show first 4 and last 4 characters)
 */
export function maskKey(key: string): string {
  if (!key || key.length < 8) return "••••••••";
  return key.substring(0, 4) + "••••" + key.substring(key.length - 4);
}

/**
 * Validate API key format for known providers
 */
export function validateApiKeyFormat(provider: string, key: string): { valid: boolean; error?: string } {
  if (!key || key.trim() === "") {
    return { valid: true }; // Empty is valid (means remove key)
  }
  
  const trimmed = key.trim();
  
  switch (provider) {
    case "openai":
      if (!trimmed.startsWith("sk-")) {
        return { valid: false, error: "OpenAI keys should start with 'sk-'" };
      }
      if (trimmed.length < 20) {
        return { valid: false, error: "OpenAI key seems too short" };
      }
      break;
      
    case "deepseek":
      if (!trimmed.startsWith("sk-")) {
        return { valid: false, error: "DeepSeek keys should start with 'sk-'" };
      }
      break;
      
    case "google":
      if (trimmed.length < 20) {
        return { valid: false, error: "Google API key seems too short" };
      }
      break;
      
    case "mistral":
      if (trimmed.length < 20) {
        return { valid: false, error: "Mistral API key seems too short" };
      }
      break;
  }
  
  // General validation - no whitespace, reasonable length
  if (/\s/.test(trimmed)) {
    return { valid: false, error: "API key should not contain whitespace" };
  }
  
  if (trimmed.length > 256) {
    return { valid: false, error: "API key is too long" };
  }
  
  return { valid: true };
}
