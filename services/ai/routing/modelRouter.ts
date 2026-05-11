import type { AiProviderId, AiTask } from "../types";

export type AiModelCandidate = {
  id: string;
  label: string;
  vendor: "deepseek" | "qwen" | "google" | "mistral" | "placeholder" | "other";
  priceTier: "free" | "low-cost" | "mock";
};

export type AiModelRoute = {
  primary: string;
  fallbacks: string[];
};

const FREE_OPENROUTER_MODELS: AiModelCandidate[] = [
  {
    id: "deepseek/deepseek-chat-v3.1:free",
    label: "DeepSeek Chat free",
    priceTier: "free",
    vendor: "deepseek"
  },
  {
    id: "qwen/qwen3-235b-a22b:free",
    label: "Qwen3 free",
    priceTier: "free",
    vendor: "qwen"
  },
  {
    id: "google/gemini-2.0-flash-exp:free",
    label: "Gemini 2.0 Flash free",
    priceTier: "free",
    vendor: "google"
  },
  {
    id: "mistralai/mistral-7b-instruct:free",
    label: "Mistral 7B free",
    priceTier: "free",
    vendor: "mistral"
  }
];

const DEFAULT_MODELS: Record<AiProviderId, string> = {
  anthropic: "screensmart-disabled-provider",
  gemini: "google/gemini-2.0-flash-exp:free",
  ollama: "screensmart-disabled-provider",
  openai: "screensmart-disabled-provider",
  openrouter: FREE_OPENROUTER_MODELS[0].id,
  placeholder: "screensmart-mock-model"
};

const DEFAULT_OPENROUTER_ROUTES: Record<AiTask, string[]> = {
  detailed_summary: [
    "qwen/qwen3-235b-a22b:free",
    "deepseek/deepseek-chat-v3.1:free",
    "google/gemini-2.0-flash-exp:free"
  ],
  explain: [
    "deepseek/deepseek-chat-v3.1:free",
    "qwen/qwen3-235b-a22b:free",
    "google/gemini-2.0-flash-exp:free"
  ],
  key_points: [
    "qwen/qwen3-235b-a22b:free",
    "mistralai/mistral-7b-instruct:free",
    "deepseek/deepseek-chat-v3.1:free"
  ],
  short_summary: [
    "deepseek/deepseek-chat-v3.1:free",
    "qwen/qwen3-235b-a22b:free",
    "google/gemini-2.0-flash-exp:free"
  ],
  talkback_answer: [
    "google/gemini-2.0-flash-exp:free",
    "deepseek/deepseek-chat-v3.1:free",
    "qwen/qwen3-235b-a22b:free"
  ]
};

const TASK_ENV_KEYS: Record<AiTask, string[]> = {
  detailed_summary: ["EXPO_PUBLIC_OPENROUTER_DETAILED_SUMMARY_MODELS", "EXPO_PUBLIC_OPENROUTER_SUMMARY_MODELS"],
  explain: ["EXPO_PUBLIC_OPENROUTER_EXPLAIN_MODELS"],
  key_points: ["EXPO_PUBLIC_OPENROUTER_BULLET_MODELS"],
  short_summary: ["EXPO_PUBLIC_OPENROUTER_SUMMARY_MODELS"],
  talkback_answer: ["EXPO_PUBLIC_OPENROUTER_TALKBACK_MODELS"]
};

export function getModelForTask(providerId: AiProviderId, task: AiTask) {
  if (providerId === "openrouter") {
    return getModelRouteForTask(providerId, task).primary;
  }

  return DEFAULT_MODELS[providerId];
}

export function getModelRouteForTask(providerId: AiProviderId, task: AiTask): AiModelRoute {
  if (providerId !== "openrouter") {
    return {
      fallbacks: [],
      primary: DEFAULT_MODELS[providerId]
    };
  }

  const models = getModelsForTask(task);

  return {
    fallbacks: models.slice(1),
    primary: models[0]
  };
}

export function getModelsForTask(task: AiTask) {
  const configuredModels = readConfiguredModels(TASK_ENV_KEYS[task]);
  const defaultModels = DEFAULT_OPENROUTER_ROUTES[task];

  return dedupeModels([
    ...configuredModels,
    ...readConfiguredModels(["EXPO_PUBLIC_OPENROUTER_DEFAULT_MODELS", "EXPO_PUBLIC_OPENROUTER_MODEL"]),
    ...defaultModels
  ]);
}

export function getFallbackModel(providerId: AiProviderId) {
  if (providerId !== "openrouter") {
    return DEFAULT_MODELS.placeholder;
  }

  return readConfiguredModels(["EXPO_PUBLIC_OPENROUTER_FALLBACK_MODELS", "EXPO_PUBLIC_OPENROUTER_FALLBACK_MODEL"])[0]
    ?? "mistralai/mistral-7b-instruct:free";
}

export function listLowCostOpenRouterModels() {
  return FREE_OPENROUTER_MODELS;
}

function readConfiguredModels(envKeys: string[]) {
  return envKeys.flatMap((key) => splitModels(process.env[key])).filter(isAllowedFreeModel);
}

function splitModels(value?: string) {
  return (value ?? "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);
}

function dedupeModels(models: string[]) {
  return Array.from(new Set(models));
}

function isAllowedFreeModel(model: string) {
  return FREE_OPENROUTER_MODELS.some((candidate) => candidate.id === model) || model.endsWith(":free");
}
