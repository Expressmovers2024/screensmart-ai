import type { AiProviderId, AiTask } from "../types";

const DEFAULT_MODELS: Record<AiProviderId, string> = {
  anthropic: "claude-3-5-haiku-latest",
  gemini: "gemini-1.5-flash",
  ollama: "llama3.1",
  openai: "gpt-4o-mini",
  openrouter: "openai/gpt-4o-mini",
  placeholder: "screensmart-mock-model"
};

export function getModelForTask(providerId: AiProviderId, task: AiTask) {
  const envModel =
    process.env.EXPO_PUBLIC_OPENROUTER_MODEL ||
    process.env.OPENROUTER_MODEL ||
    process.env.EXPO_PUBLIC_AI_MODEL;

  if (providerId === "openrouter" && envModel) {
    return envModel;
  }

  if (task === "detailed_summary" && providerId === "openrouter") {
    return process.env.EXPO_PUBLIC_OPENROUTER_DETAILED_MODEL || DEFAULT_MODELS.openrouter;
  }

  return DEFAULT_MODELS[providerId];
}

export function getFallbackModel(providerId: AiProviderId) {
  return providerId === "openrouter"
    ? process.env.EXPO_PUBLIC_OPENROUTER_FALLBACK_MODEL || "meta-llama/llama-3.1-8b-instruct:free"
    : DEFAULT_MODELS.placeholder;
}
