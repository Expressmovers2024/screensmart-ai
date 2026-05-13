/**
 * Canonical free-model allowlist for ScreenSmart AI.
 *
 * This file is the SINGLE SOURCE OF TRUTH for permitted OpenRouter free models.
 *
 * Usage:
 *   - Client-side: imported directly by modelRouter.ts
 *   - Edge Function (ai-proxy): ALLOWED_FREE_OPENROUTER_MODELS and
 *     ALLOWED_FREE_VISION_MODELS are derived from this list at build time.
 *     If you add/remove a model here, regenerate the edge function constants
 *     by running: `npm run sync:edge-models`
 *
 * Rules:
 *   - Only models with a `:free` suffix on OpenRouter are permitted.
 *   - Vision-capable models must declare `"vision"` in capabilities.
 *   - Do not add paid models — the proxy enforces the allowlist server-side.
 */

export type AiModelVendor =
  | "deepseek"
  | "qwen"
  | "google"
  | "mistral"
  | "meta"
  | "placeholder"
  | "other";

export type AiModelCapability = "text" | "vision";
export type AiModelPriceTier = "free" | "low-cost" | "mock";

export type AiModelCandidate = {
  id: string;
  label: string;
  vendor: AiModelVendor;
  priceTier: AiModelPriceTier;
  capabilities: AiModelCapability[];
};

export const FREE_OPENROUTER_MODELS: AiModelCandidate[] = [
  {
    id: "deepseek/deepseek-chat-v3.1:free",
    capabilities: ["text"],
    label: "DeepSeek Chat v3.1 (free)",
    priceTier: "free",
    vendor: "deepseek"
  },
  {
    id: "qwen/qwen3-235b-a22b:free",
    capabilities: ["text"],
    label: "Qwen3 235B (free)",
    priceTier: "free",
    vendor: "qwen"
  },
  {
    id: "google/gemini-2.0-flash-exp:free",
    capabilities: ["text", "vision"],
    label: "Gemini 2.0 Flash (free)",
    priceTier: "free",
    vendor: "google"
  },
  {
    id: "mistralai/mistral-7b-instruct:free",
    capabilities: ["text"],
    label: "Mistral 7B Instruct (free)",
    priceTier: "free",
    vendor: "mistral"
  },
  {
    id: "qwen/qwen2.5-vl-72b-instruct:free",
    capabilities: ["vision"],
    label: "Qwen2.5 VL 72B (free)",
    priceTier: "free",
    vendor: "qwen"
  },
  {
    id: "meta-llama/llama-3.2-11b-vision-instruct:free",
    capabilities: ["vision"],
    label: "Llama 3.2 Vision 11B (free)",
    priceTier: "free",
    vendor: "meta"
  }
];

/** Flat set of all permitted model IDs — used for fast membership checks. */
export const ALLOWED_FREE_MODEL_IDS: ReadonlySet<string> = new Set(
  FREE_OPENROUTER_MODELS.map((m) => m.id)
);

/** Subset that supports image input. */
export const FREE_VISION_MODEL_IDS: ReadonlySet<string> = new Set(
  FREE_OPENROUTER_MODELS.filter((m) => m.capabilities.includes("vision")).map((m) => m.id)
);

/** Returns true if a model string is an allowed free model. */
export function isAllowedFreeModel(model: string, requiresVision = false): boolean {
  if (!ALLOWED_FREE_MODEL_IDS.has(model) && !model.endsWith(":free")) {
    return false;
  }
  return requiresVision ? FREE_VISION_MODEL_IDS.has(model) : true;
}
