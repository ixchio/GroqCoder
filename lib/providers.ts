// Provider and Model Configuration for Groq Coder
// Free open-source AI models from Groq, OpenRouter, Cerebras, and Hugging Face
// All providers use free tier - no user API keys required

export type ProviderType = "groq" | "cerebras" | "huggingface" | "openrouter";

export interface Provider {
  id: ProviderType;
  name: string;
  baseUrl: string;
  requiresUserKey: boolean;
  description: string;
  icon: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: ProviderType;
  contextLength: number;
  description: string;
  isNew?: boolean;
  isDeprecating?: boolean;
  deprecationDate?: string;
  isThinker?: boolean;
}

// FREE PROVIDERS - No user API key required (uses app's free tier)
export const FREE_PROVIDERS: Record<string, Provider> = {
  groq: {
    id: "groq",
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    requiresUserKey: false,
    description: "Lightning fast LPU inference - ultra-low latency",
    icon: "⚡",
  },
  cerebras: {
    id: "cerebras",
    name: "Cerebras",
    baseUrl: "https://api.cerebras.ai/v1",
    requiresUserKey: false,
    description: "Ultra-fast inference with Cerebras WSE - 1M free tokens/day",
    icon: "🧠",
  },
  huggingface: {
    id: "huggingface",
    name: "Hugging Face",
    baseUrl: "https://api-inference.huggingface.co/models",
    requiresUserKey: false,
    description: "Free inference API with open models",
    icon: "🤗",
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    requiresUserKey: false,
    description: "Access 100+ free models via OpenRouter",
    icon: "🌐",
  },
};

// No BYOK providers - all free!
export const BYOK_PROVIDERS: Record<string, Provider> = {};

// All providers combined
export const ALL_PROVIDERS = { ...FREE_PROVIDERS, ...BYOK_PROVIDERS };

// FREE MODELS - Available without user API key
export const FREE_MODELS: AIModel[] = [
  // ========== GROQ MODELS (Lightning fast LPU inference) ==========
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B (Groq)",
    provider: "groq",
    contextLength: 128000,
    description: "Meta's Llama 3.3 on Groq LPU - lightning fast inference",
    isNew: true,
  },

  // ========== CEREBRAS MODELS (Ultra-fast, 1M free tokens/day) ==========
  {
    id: "llama-3.3-70b",
    name: "Llama 3.3 70B (Cerebras)",
    provider: "cerebras",
    contextLength: 8192,
    description: "Meta's Llama 3.3 on Cerebras WSE - ultra-fast inference",
    isNew: true,
  },
  {
    id: "llama3.1-8b",
    name: "Llama 3.1 8B (Cerebras)",
    provider: "cerebras",
    contextLength: 8192,
    description: "Fast and efficient for quick generations",
  },
  {
    id: "qwen-3-32b",
    name: "Qwen 3 32B (Cerebras)",
    provider: "cerebras",
    contextLength: 32768,
    description: "Alibaba's latest Qwen model - great for coding",
    isNew: true,
  },

  // ========== HUGGING FACE MODELS (Free Inference API) ==========
  {
    id: "mistralai/Mistral-7B-Instruct-v0.3",
    name: "Mistral 7B Instruct",
    provider: "huggingface",
    contextLength: 32768,
    description: "Fast and capable open model",
  },
  {
    id: "meta-llama/Llama-3.2-3B-Instruct",
    name: "Llama 3.2 3B",
    provider: "huggingface",
    contextLength: 8192,
    description: "Compact Llama for quick tasks",
  },
  {
    id: "Qwen/Qwen2.5-Coder-7B-Instruct",
    name: "Qwen 2.5 Coder 7B",
    provider: "huggingface",
    contextLength: 32768,
    description: "Specialized code generation model",
    isNew: true,
  },
  {
    id: "microsoft/Phi-3-mini-4k-instruct",
    name: "Phi-3 Mini 4K",
    provider: "huggingface",
    contextLength: 4096,
    description: "Microsoft's compact powerhouse",
  },

  // ========== OPENROUTER FREE MODELS ==========
  {
    id: "qwen/qwen3-coder:free",
    name: "Qwen3 Coder (Free)",
    provider: "openrouter",
    contextLength: 128000,
    description: "Alibaba's best coding model - recommended!",
    isNew: true,
  },
  {
    id: "openai/gpt-oss-20b:free",
    name: "GPT-OSS 20B (Free)",
    provider: "openrouter",
    contextLength: 32000,
    description: "OpenAI's open-source model",
    isNew: true,
  },
  {
    id: "google/gemini-2.0-flash-exp:free",
    name: "Gemini 2.0 Flash Exp (Free)",
    provider: "openrouter",
    contextLength: 128000,
    description: "Google's experimental Gemini 2.0 Flash",
    isNew: true,
  },
  {
    id: "openai/gpt-oss-120b:free",
    name: "GPT-OSS 120B (Free)",
    provider: "openrouter",
    contextLength: 32000,
    description: "OpenAI's large open-source model",
    isNew: true,
  },
  {
    id: "moonshotai/kimi-k2:free",
    name: "Kimi K2 (Free)",
    provider: "openrouter",
    contextLength: 128000,
    description: "Moonshot AI's powerful Kimi K2",
    isNew: true,
  },
  {
    id: "tngtech/deepseek-r1t2-chimera:free",
    name: "DeepSeek R1T2 Chimera (Free)",
    provider: "openrouter",
    contextLength: 64000,
    description: "TNG's advanced reasoning model",
    isThinker: true,
    isNew: true,
  },
  {
    id: "tngtech/deepseek-r1t-chimera:free",
    name: "DeepSeek R1T Chimera (Free)",
    provider: "openrouter",
    contextLength: 64000,
    description: "TNG's reasoning model",
    isThinker: true,
    isNew: true,
  },
  {
    id: "mistralai/devstral-2512:free",
    name: "Devstral (Free)",
    provider: "openrouter",
    contextLength: 128000,
    description: "Mistral's developer-focused model",
    isNew: true,
  },
  {
    id: "nex-agi/deepseek-v3.1-nex-n1:free",
    name: "DeepSeek V3.1 Nex N1 (Free)",
    provider: "openrouter",
    contextLength: 64000,
    description: "Nex AGI's DeepSeek variant",
    isNew: true,
  },
  {
    id: "arcee-ai/trinity-mini:free",
    name: "Trinity Mini (Free)",
    provider: "openrouter",
    contextLength: 32000,
    description: "Arcee AI's compact model",
    isNew: true,
  },
];

// No BYOK MODELS - all free!
export const BYOK_MODELS: AIModel[] = [];

// All models combined
export const ALL_MODELS = [...FREE_MODELS, ...BYOK_MODELS];

// Helper functions
export function getProviderById(id: string): Provider | undefined {
  return ALL_PROVIDERS[id];
}

export function getModelById(id: string): AIModel | undefined {
  return ALL_MODELS.find((m) => m.id === id);
}

export function getModelsByProvider(providerId: ProviderType): AIModel[] {
  return ALL_MODELS.filter((m) => m.provider === providerId);
}

export function getFreeModels(): AIModel[] {
  return FREE_MODELS;
}

export function getBYOKModels(): AIModel[] {
  return BYOK_MODELS;
}

export function isProviderFree(providerId: string): boolean {
  return providerId in FREE_PROVIDERS;
}

// Default model selection - Groq LPU for lightning fast inference
export const DEFAULT_MODEL = "llama-3.3-70b-versatile";
export const DEFAULT_PROVIDER = "groq";

// Backward-compatible exports for existing frontend components
// Maps the new format to the legacy format expected by UI components
export const PROVIDERS = Object.fromEntries(
  Object.entries(ALL_PROVIDERS).map(([key, provider]) => [
    key,
    {
      name: provider.name,
      max_tokens: 16384, // Default max tokens
      id: provider.id,
    },
  ])
);

export const MODELS = ALL_MODELS.map((model) => ({
  value: model.id,
  label: model.name,
  providers: [model.provider],
  autoProvider: model.provider,
  isNew: model.isNew,
  isThinker: model.isThinker,
}));
