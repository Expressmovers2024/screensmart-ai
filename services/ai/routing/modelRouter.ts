/**
 * Client-side model router for ScreenSmart AI.
 *
 * Model definitions are imported from constants/freeModels.ts — the single
 * source of truth. The edge function (supabase/functions/ai-proxy) mirrors
 * the same list; run `npm run sync:edge-models` after adding a model here.
 */

import {
  FREE_OPENROUTER_MODELS,
  isAllowedFreeModel
} from "@/constants/freeModels";
import type { AiModelCandidate } from "@/constants/freeModels";
import type { AiProviderId, AiTask } from "../types";

export type { AiModelCandidate };

export type AiModelRoute = {
  primary: string;
  fallbacks: string[];
};

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
  ],
  vision_analysis: [
    "google/gemini-2.0-flash-exp:free",
    "qwen/qwen2.5-vl-72b-instruct:free",
    "meta-llama/llama-3.2-11b-vision-instruct:free"
  ],
  research_planning: [
    "deepseek/deepseek-chat-v3.1:free",
    "qwen/qwen3-235b-a22b:free",
    "google/gemini-2.0-flash-exp:free"
  ]
};

const TASK_ENV_KEYS: Record<AiTask, string[]> = {
  detailed_summary: [
    "EXPO_PUBLIC_OPENROUTER_DETAILED_SUMMARY_MODELS",
    "EXPO_PUBLIC_OPENROUTER_SUMMARY_MODELS"
  ],
  explain: ["EXPO_PUBLIC_OPENROUTER_EXPLAIN_MODELS"],
  key_points: ["EXPO_PUBLIC_OPENROUTER_BULLET_MODELS"],
  short_summary: ["EXPO_PUBLIC_OPENROUTER_SUMMARY_MODELS"],
  talkback_answer: ["EXPO_PUBLIC_OPENROUTER_TALKBACK_MODELS"],
  vision_analysis: ["EXPO_PUBLIC_OPENROUTER_VISION_MODELS"],
  research_planning: ["EXPO_PUBLIC_OPENROUTER_RESEARCH_MODELS"]
};

export function getModelForTask(providerId: AiProviderId, task: AiTask): string {
  if (providerId === "openrouter") {
    return getModelRouteForTask(providerId, task).primary;
  }
  return DEFAULT_MODELS[providerId];
}

export function getModelRouteForTask(
  providerId: AiProviderId,
  task: AiTask
): AiModelRoute {
  if (providerId !== "openrouter") {
    return { fallbacks: [], primary: DEFAULT_MODELS[providerId] };
  }
  const models = getModelsForTask(task);
  return { fallbacks: models.slice(1), primary: models[0] };
}

export function getModelsForTask(task: AiTask): string[] {
  const configuredModels = readConfiguredModels(TASK_ENV_KEYS[task]);
  const defaultModels = DEFAULT_OPENROUTER_ROUTES[task];
  return dedupeModels([
    ...configuredModels,
    ...readConfiguredModels([
      "EXPO_PUBLIC_OPENROUTER_DEFAULT_MODELS",
      "EXPO_PUBLIC_OPENROUTER_MODEL"
    ]),
    ...defaultModels
  ]);
}

export function getFallbackModel(providerId: AiProviderId): string {
  if (providerId !== "openrouter") return DEFAULT_MODELS.placeholder;
  return (
    readConfiguredModels([
      "EXPO_PUBLIC_OPENROUTER_FALLBACK_MODELS",
      "EXPO_PUBLIC_OPENROUTER_FALLBACK_MODEL"
    ])[0] ?? "mistralai/mistral-7b-instruct:free"
  );
}

export function listLowCostOpenRouterModels(): AiModelCandidate[] {
  return FREE_OPENROUTER_MODELS;
}

export function listFreeVisionOpenRouterModels(): AiModelCandidate[] {
  return FREE_OPENROUTER_MODELS.filter((m) => m.capabilities.includes("vision"));
}

function readConfiguredModels(envKeys: string[]): string[] {
  return envKeys
    .flatMap((key) => splitModels(process.env[key]))
    .filter((m) => isAllowedFreeModel(m));
}

function splitModels(value?: string): string[] {
  return (value ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
}

function dedupeModels(models: string[]): string[] {
  return Array.from(new Set(models));
}
