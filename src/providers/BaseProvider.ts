import { createId } from "@/utils/createId";

import type {
  IProvider,
  ProviderCapability,
  ProviderCostTier,
  ProviderDescriptor,
  ProviderHealthStatus,
  ProviderRequest,
  ProviderResponse
} from "./ProviderTypes";

/**
 * BaseProvider
 *
 * Abstract base class for all ScreenSmart AI providers.
 *
 * Provides:
 *   - Capability matching helpers
 *   - Health-check result caching (30-second TTL)
 *   - Safe fallback response builder
 *   - Error normalisation
 */
export abstract class BaseProvider implements IProvider {
  abstract id: string;
  abstract name: string;
  abstract capabilities: ProviderCapability[];
  abstract supportsVision: boolean;
  abstract supportsTools: boolean;
  abstract supportsStreaming: boolean;
  abstract local: boolean;
  abstract costTier: ProviderCostTier;
  abstract available: boolean;

  private _lastHealthCheck: ProviderHealthStatus | null = null;
  private _healthCheckTtlMs = 30_000;

  // ---------------------------------------------------------------------------
  // Abstract methods — each provider implements these
  // ---------------------------------------------------------------------------

  abstract generateText(request: ProviderRequest): Promise<ProviderResponse>;

  abstract analyzeImage(
    request: ProviderRequest & { imageBase64: string; mimeType?: string }
  ): Promise<ProviderResponse>;

  abstract healthCheck(): Promise<ProviderHealthStatus>;

  // ---------------------------------------------------------------------------
  // Convenience methods — default to generateText, can be overridden
  // ---------------------------------------------------------------------------

  async summarize(request: ProviderRequest): Promise<ProviderResponse> {
    return this.generateText({
      ...request,
      requiredCapabilities: Array.from(
        new Set([...request.requiredCapabilities, "text_summary"])
      )
    });
  }

  async chat(request: ProviderRequest): Promise<ProviderResponse> {
    return this.generateText({
      ...request,
      requiredCapabilities: Array.from(
        new Set([...request.requiredCapabilities, "chat"])
      )
    });
  }

  // ---------------------------------------------------------------------------
  // Capability helpers
  // ---------------------------------------------------------------------------

  /** Returns true if this provider satisfies all required capabilities. */
  satisfies(required: ProviderCapability[]): boolean {
    return required.every(
      (cap) =>
        this.capabilities.includes(cap) ||
        this.impliedCapabilities().includes(cap)
    );
  }

  /**
   * Capabilities implied by provider properties but not declared explicitly.
   * e.g. if supportsVision = true, "vision_analysis" is implied.
   */
  private impliedCapabilities(): ProviderCapability[] {
    const implied: ProviderCapability[] = [];
    if (this.supportsVision) implied.push("vision_analysis");
    if (this.supportsStreaming) implied.push("streaming");
    if (this.local) implied.push("local");
    if (this.costTier === "free") implied.push("low_cost");
    return implied;
  }

  // ---------------------------------------------------------------------------
  // Cached health check
  // ---------------------------------------------------------------------------

  async getCachedHealth(): Promise<ProviderHealthStatus> {
    if (
      this._lastHealthCheck &&
      Date.now() - new Date(this._lastHealthCheck.checkedAt).getTime() <
        this._healthCheckTtlMs
    ) {
      return this._lastHealthCheck;
    }
    this._lastHealthCheck = await this.healthCheck();
    return this._lastHealthCheck;
  }

  invalidateHealthCache(): void {
    this._lastHealthCheck = null;
  }

  // ---------------------------------------------------------------------------
  // Response builder helpers (for use in subclasses)
  // ---------------------------------------------------------------------------

  protected buildResponse(
    content: string,
    model: string,
    request: ProviderRequest,
    extras?: Partial<ProviderResponse>
  ): ProviderResponse {
    return {
      id: createId(`${this.id}-response`),
      providerId: this.id,
      model,
      content,
      createdAt: new Date().toISOString(),
      fallbackUsed: false,
      usage: estimateUsage(request.prompt),
      ...extras
    };
  }

  protected buildUnavailableError(feature: string): Error {
    return new Error(
      `${this.name} does not support ${feature}. ` +
        `Provider capabilities: ${this.capabilities.join(", ")}`
    );
  }

  protected buildHealthStatus(
    available: boolean,
    latencyMs?: number,
    error?: string
  ): ProviderHealthStatus {
    return {
      providerId: this.id,
      available,
      latencyMs,
      error,
      checkedAt: new Date().toISOString()
    };
  }
}

function estimateUsage(prompt: string): ProviderResponse["usage"] {
  const promptTokens = Math.ceil(prompt.length / 4);
  return {
    completionTokens: 120,
    estimated: true,
    promptTokens,
    totalTokens: promptTokens + 120
  };
}
