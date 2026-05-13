/**
 * Usage & Cost Transparency types for ScreenSmart AI OS.
 *
 * Every AI request the app makes produces a UsageEvent.
 * These are stored locally and surfaced in Settings so users can see
 * exactly where each request went — no hidden cloud calls.
 *
 * Source classification:
 *   local      — Ollama running on the user's own machine
 *   cloud_free — OpenRouter with a :free-suffix model (no charge)
 *   cloud_paid — Any paid cloud provider (future: OpenAI, Anthropic)
 *   mock       — Placeholder/fallback with no real AI
 */

export type UsageSource = "local" | "cloud_free" | "cloud_paid" | "mock";

export type UsageEvent = {
  id: string;
  sessionId?: string;
  missionId?: string;
  /** Provider that actually handled the request */
  providerId: string;
  providerName: string;
  model?: string;
  /** Primary capability requested (e.g. "text_summary") */
  capability: string;
  /** Task name from ProviderRequest (e.g. "short_summary") */
  taskType: string;
  /** Simplified source bucket for display */
  source: UsageSource;
  estimatedTokens?: number;
  /**
   * Estimated USD cost of this call.
   * Local/free = $0. Paid = calculated from token count.
   * Used to show "you saved $X by using local AI."
   */
  estimatedCostUsd: number;
  /** Wall-clock milliseconds from request to response */
  durationMs?: number;
  success: boolean;
  fallbackUsed: boolean;
  /** Provider originally targeted before any fallback */
  requestedProviderId?: string;
  createdAt: string;
};

// ---------------------------------------------------------------------------
// Summary types
// ---------------------------------------------------------------------------

export type UsageBySource = {
  local: number;
  cloud_free: number;
  cloud_paid: number;
  mock: number;
};

export type UsageSummary = {
  totalCalls: number;
  bySource: UsageBySource;
  /** Total estimated tokens across all calls */
  totalEstimatedTokens: number;
  /** Total estimated USD cost (paid calls only) */
  totalEstimatedCostUsd: number;
  /**
   * Estimated USD that would have been spent if every local call
   * had gone to a paid cloud provider at the reference rate.
   */
  estimatedSavedByLocalUsd: number;
  /** Percentage of calls served locally */
  localPercentage: number;
  /** Percentage of calls served by any free source (local + cloud_free) */
  freePercentage: number;
  successRate: number;
  fallbackRate: number;
  /** ISO timestamp of the oldest event included */
  since?: string;
};

// ---------------------------------------------------------------------------
// Cost constants (used for "cost saved" estimation only)
// ---------------------------------------------------------------------------

/**
 * Reference USD per token used to estimate what a paid cloud call would cost.
 * Based on GPT-4o input/output blended average as a conservative reference.
 * Not used for billing — only for illustrating local AI savings.
 */
export const REFERENCE_COST_PER_TOKEN_USD = 0.000003;
