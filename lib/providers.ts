// Provider and Model Configuration for Groq Coder
// Free open-source AI models from Groq, Cerebras, and Together AI
// Plus BYOK support for OpenAI, DeepSeek, Mistral, and Google Gemini

export type ProviderType = "groq" | "cerebras" | "huggingface" | "openrouter" | "openai" | "deepseek" | "mistral" | "google";

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
    description: "Ultra-fast inference with Groq LPU",
    icon: "⚡",
  },
  cerebras: {
    id: "cerebras",
    name: "Cerebras",
    baseUrl: "https://api.cerebras.ai/v1",
    requiresUserKey: false,
    description: "1M free tokens/day with Cerebras",
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
    description: "Access 100+ models via OpenRouter",
    icon: "🌐",
  },
};

// BYOK PROVIDERS - User must provide their own API key
export const BYOK_PROVIDERS: Record<string, Provider> = {
  openai: {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    requiresUserKey: true,
    description: "GPT-4o, GPT-4 Turbo, and more",
    icon: "🤖",
  },
  deepseek: {
    id: "deepseek",
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    requiresUserKey: true,
    description: "DeepSeek V3, R1, and Coder models",
    icon: "🔍",
  },
  mistral: {
    id: "mistral",
    name: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    requiresUserKey: true,
    description: "Mistral Large, Medium, and Codestral",
    icon: "🌬️",
  },
  google: {
    id: "google",
    name: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    requiresUserKey: true,
    description: "Gemini Pro and Flash models",
    icon: "✨",
  },
};

// All providers combined
export const ALL_PROVIDERS = { ...FREE_PROVIDERS, ...BYOK_PROVIDERS };

// FREE MODELS - Available without user API key
export const FREE_MODELS: AIModel[] = [
  // Groq Models
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B Versatile",
    provider: "groq",
    contextLength: 128000,
    description: "Meta's most capable model, great for complex tasks",
    isNew: true,
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B Instant",
    provider: "groq",
    contextLength: 128000,
    description: "Fast and efficient for quick generations",
  },
  {
    id: "llama-3.3-70b-specdec",
    name: "Llama 3.3 70B SpecDec",
    provider: "groq",
    contextLength: 128000,
    description: "Speculative decoding for faster inference",
    isNew: true,
  },
  {
    id: "mixtral-8x7b-32768",
    name: "Mixtral 8x7B",
    provider: "groq",
    contextLength: 32768,
    description: "MoE model with excellent coding abilities",
    isDeprecating: true,
    deprecationDate: "2025-03-20",
  },
  {
    id: "gemma2-9b-it",
    name: "Gemma 2 9B",
    provider: "groq",
    contextLength: 8192,
    description: "Google's open model, great for general tasks",
  },
  {
    id: "qwen-qwq-32b",
    name: "Qwen QWQ 32B",
    provider: "groq",
    contextLength: 32768,
    description: "Alibaba's reasoning model",
    isNew: true,
  },
  {
    id: "deepseek-r1-distill-llama-70b",
    name: "DeepSeek R1 Distill 70B",
    provider: "groq",
    contextLength: 128000,
    description: "DeepSeek R1 distilled into Llama architecture",
    isThinker: true,
    isNew: true,
  },
  {
    id: "compound-beta",
    name: "Compound Beta",
    provider: "groq",
    contextLength: 128000,
    description: "Groq's experimental compound AI system",
    isNew: true,
  },
  {
    id: "openai/gpt-oss-120b",
    name: "GPT-OSS 120B",
    provider: "groq",
    contextLength: 8192,
    description: "OpenAI's open-source reasoning model on Groq",
    isThinker: true,
    isNew: true,
  },
  {
    id: "qwen/qwen3-32b",
    name: "Qwen3 32B",
    provider: "groq",
    contextLength: 4096,
    description: "Alibaba's Qwen3 model on Groq",
    isNew: true,
  },
  {
    id: "moonshotai/kimi-k2-instruct-0905",
    name: "Kimi K2 Instruct",
    provider: "groq",
    contextLength: 4096,
    description: "Moonshot AI's Kimi K2 model on Groq",
    isNew: true,
  },
  // Cerebras Models
  {
    id: "llama-3.3-70b",
    name: "Llama 3.3 70B (Cerebras)",
    provider: "cerebras",
    contextLength: 8192,
    description: "Llama 3.3 on Cerebras wafer-scale engine",
  },
  {
    id: "qwen-3-32b",
    name: "Qwen 3 32B",
    provider: "cerebras",
    contextLength: 32768,
    description: "Alibaba's latest Qwen model",
    isNew: true,
  },
  // Hugging Face Models (Free Inference API)
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
    description: "Free code generation model",
    isNew: true,
  },
  // OpenRouter Free Models
  {
    id: "qwen/qwen3-coder:free",
    name: "Qwen3 Coder (Free)",
    provider: "openrouter",
    contextLength: 128000,
    description: "Alibaba's latest Qwen3 coding model",
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

// BYOK MODELS - Require user's own API key
export const BYOK_MODELS: AIModel[] = [
  // OpenAI Models
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    contextLength: 128000,
    description: "OpenAI's most capable multimodal model",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    contextLength: 128000,
    description: "Fast and affordable GPT-4 variant",
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "openai",
    contextLength: 128000,
    description: "GPT-4 with improved capabilities",
  },
  // DeepSeek Models
  {
    id: "deepseek-chat",
    name: "DeepSeek V3",
    provider: "deepseek",
    contextLength: 64000,
    description: "DeepSeek's latest chat model",
  },
  {
    id: "deepseek-reasoner",
    name: "DeepSeek R1",
    provider: "deepseek",
    contextLength: 64000,
    description: "Advanced reasoning model",
    isThinker: true,
  },
  // Mistral Models
  {
    id: "mistral-large-latest",
    name: "Mistral Large",
    provider: "mistral",
    contextLength: 128000,
    description: "Mistral's flagship model",
  },
  {
    id: "codestral-latest",
    name: "Codestral",
    provider: "mistral",
    contextLength: 32000,
    description: "Specialized for code generation",
  },
  // Google Gemini Models
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "google",
    contextLength: 2000000,
    description: "Google's most capable model",
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    provider: "google",
    contextLength: 1000000,
    description: "Fast and efficient Gemini variant",
  },
];

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

// Default model selection
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

