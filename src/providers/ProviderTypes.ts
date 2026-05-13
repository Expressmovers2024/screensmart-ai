/**
 * ProviderTypes — canonical type definitions for the ScreenSmart provider layer.
 *
 * DESIGN PRINCIPLE:
 * Agents declare capabilities they need, not vendors.
 * The ProviderRouter decides which provider satisfies the request.
 *
 * Capability vocabulary:
 *   text_generation   — general LLM text output
 *   text_summary      — condensation / summarisation tasks
 *   vision_analysis   — image + text multimodal input
 *   chat              — multi-turn conversation context
 *   research_planning — structured research output
 *   fast_response     — latency < 3s preferred
 *   low_cost          — free / cheapest tier preferred
 *   local             — must run on-device / local network
 *   streaming         — supports token streaming
 */

import type { OcrContext } from "@/services/ai/types";
import type { ChatMessage } from "@/types/chat";

// ---------------------------------------------------------------------------
// Capability & tier vocabulary
// ---------------------------------------------------------------------------

export type ProviderCapability =
  | "chat"
  | "fast_response"
  | "local"
  | "low_cost"
  | "research_planning"
  | "streaming"
  | "text_generation"
  | "text_summary"
  | "vision_analysis";

export type ProviderCostTier = "free" | "cheap" | "premium";

// ---------------------------------------------------------------------------
// Provider descriptor — what each provider declares about itself
// ---------------------------------------------------------------------------

export type ProviderDescriptor = {
  id: string;
  name: string;
  capabilities: ProviderCapability[];
  supportsVision: boolean;
  supportsTools: boolean;
  supportsStreaming: boolean;
  /** true = runs on localhost / device, no cloud dependency */
  local: boolean;
  costTier: ProviderCostTier;
  /** false = not configured or health check failed */
  available: boolean;
};

// ---------------------------------------------------------------------------
// Request / response types
// ---------------------------------------------------------------------------

export type ProviderRequest = {
  /** The capabilities this request requires — router uses these to pick provider */
  requiredCapabilities: ProviderCapability[];
  /** Preferred cost tier — router will try to honour this */
  preferredCostTier?: ProviderCostTier;
  /** Free-form prompt sent to the model */
  prompt: string;
  /** Structured OCR context */
  context: OcrContext;
  /** Chat history for multi-turn requests */
  history?: ChatMessage[];
  /** Caller-specified model override (skips routing) */
  modelOverride?: string;
  /** Maximum tokens in the response */
  maxTokens?: number;
  /** 0.0–1.0 temperature */
  temperature?: number;
  /** Arbitrary metadata passed through to the provider */
  meta?: Record<string, unknown>;
};

export type ProviderResponse = {
  id: string;
  /** Which provider actually served this request */
  providerId: string;
  /** Model identifier returned by the provider */
  model: string;
  content: string;
  usage: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    estimated?: boolean;
  };
  createdAt: string;
  finishReason?: string;
  /** true = a lower-priority fallback provider was used */
  fallbackUsed: boolean;
  /** Which provider was requested vs which answered */
  requestedProviderId?: string;
};

export type ProviderHealthStatus = {
  providerId: string;
  available: boolean;
  latencyMs?: number;
  error?: string;
  checkedAt: string;
};

export type ProviderStreamChunk = {
  id: string;
  providerId: string;
  contentDelta: string;
  done: boolean;
  usage?: ProviderResponse["usage"];
};

// ---------------------------------------------------------------------------
// Core provider interface — every provider implements this
// ---------------------------------------------------------------------------

export type IProvider = ProviderDescriptor & {
  /**
   * Generate a text response.
   * Must throw on failure so the router can try the next provider.
   */
  generateText(request: ProviderRequest): Promise<ProviderResponse>;

  /**
   * Analyse an image with optional text context.
   * Providers that don't support vision should throw immediately.
   */
  analyzeImage(
    request: ProviderRequest & { imageBase64: string; mimeType?: string }
  ): Promise<ProviderResponse>;

  /**
   * Convenience: summarise OCR-extracted text.
   */
  summarize(request: ProviderRequest): Promise<ProviderResponse>;

  /**
   * Convenience: multi-turn chat.
   */
  chat(request: ProviderRequest): Promise<ProviderResponse>;

  /**
   * Returns true if the provider is reachable and ready.
   * Must not throw — return false instead.
   */
  healthCheck(): Promise<ProviderHealthStatus>;

  /**
   * Returns true if this provider can satisfy all required capabilities.
   * Implemented in BaseProvider — available on every provider instance.
   */
  satisfies(required: ProviderCapability[]): boolean;

  /**
   * Clears the cached health-check result so the next call re-evaluates.
   * Implemented in BaseProvider.
   */
  invalidateHealthCache(): void;
};

// ---------------------------------------------------------------------------
// Router configuration
// ---------------------------------------------------------------------------

export type ProviderRoutingPreference = {
  requiredCapabilities: ProviderCapability[];
  preferredCostTier?: ProviderCostTier;
  /** If true, skip cloud providers and only try local ones */
  localOnly?: boolean;
  /** Allow degraded responses from mock/placeholder providers */
  allowMock?: boolean;
};
