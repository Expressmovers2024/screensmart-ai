/**
 * ProviderRouter
 *
 * Routes AI requests based on declared capabilities, not vendor names.
 *
 * Priority order (default):
 *   1. Local providers (Ollama) — zero cost, maximum privacy
 *   2. Free cloud providers (OpenRouter) — no cost, requires network
 *   3. Cheap cloud providers — paid but economical
 *   4. Premium cloud providers (OpenAI, Anthropic) — highest capability
 *   5. Mock provider — always available, labelled as placeholder
 *
 * Every resolved request is recorded by UsageTracker so users can see
 * exactly where each AI call went in the Usage & Cost Transparency UI.
 */

import { usageTracker } from "@/services/usage";

import { providerRegistry } from "./ProviderRegistry";
import type {
  IProvider,
  ProviderCapability,
  ProviderCostTier,
  ProviderRequest,
  ProviderResponse,
  ProviderRoutingPreference
} from "./ProviderTypes";

const TIER_PRIORITY: Record<ProviderCostTier, number> = {
  free: 0,
  cheap: 1,
  premium: 2
};

export type LocalAiRoutingConfig = {
  preferLocalModels: boolean;
  allowCloudFallback: boolean;
  preferredLocalModel?: string;
};

const DEFAULT_CONFIG: LocalAiRoutingConfig = {
  preferLocalModels: false,
  allowCloudFallback: true,
  preferredLocalModel: undefined
};

export class ProviderRouter {
  private config: LocalAiRoutingConfig = { ...DEFAULT_CONFIG };

  constructor(private readonly registry = providerRegistry) {}

  configure(config: Partial<LocalAiRoutingConfig>): void {
    this.config = { ...DEFAULT_CONFIG, ...config };
    if (config.preferredLocalModel) {
      const ollama = this.registry.get("ollama");
      if (ollama && "setPreferredModel" in ollama) {
        (ollama as { setPreferredModel: (m: string) => void }).setPreferredModel(
          config.preferredLocalModel
        );
      }
    }
  }

  getConfig(): Readonly<LocalAiRoutingConfig> {
    return this.config;
  }

  /**
   * Route a text request to the best available provider.
   * Records a UsageEvent for every resolved request — success or failure.
   * Never throws.
   */
  async route(request: ProviderRequest): Promise<ProviderResponse> {
    const candidates = this.selectCandidates(request);
    const preferredId = candidates[0]?.id ?? "none";
    const capability = request.requiredCapabilities[0] ?? "text_generation";
    const taskType = resolveTaskType(request);
    const errors: string[] = [];
    const startMs = Date.now();

    for (const provider of candidates) {
      const providerStart = Date.now();
      try {
        const response = await dispatch(provider, request);
        this.track({
          provider,
          response,
          capability,
          taskType,
          requestedProviderId: preferredId,
          durationMs: Date.now() - providerStart,
          success: true,
          request
        });
        return response;
      } catch (error) {
        const msg = error instanceof Error ? error.message : `${provider.id} failed`;
        errors.push(`${provider.id}: ${msg}`);
        provider.invalidateHealthCache();
      }
    }

    // All candidates failed — MockProvider last resort
    const mock = this.registry.get("mock");
    const fallbackStart = Date.now();
    const response = mock
      ? await mock.generateText(request).catch(() => buildHardFallback(request))
      : buildHardFallback(request, errors.join("; "));

    const finalResponse = { ...response, fallbackUsed: true };

    this.track({
      provider: mock ?? buildNoneDescriptor(),
      response: finalResponse,
      capability,
      taskType,
      requestedProviderId: preferredId,
      durationMs: Date.now() - fallbackStart,
      success: !response.content.includes("all providers unavailable"),
      fallbackUsed: true,
      request
    });

    return finalResponse;
  }

  /**
   * Route a vision (image + text) request.
   * Records a UsageEvent for every resolved request.
   */
  async routeVision(
    request: ProviderRequest & { imageBase64: string; mimeType?: string }
  ): Promise<ProviderResponse> {
    const visionRequest: ProviderRequest = {
      ...request,
      requiredCapabilities: Array.from(
        new Set([...request.requiredCapabilities, "vision_analysis" as ProviderCapability])
      )
    };

    const candidates = this.selectCandidates(visionRequest).filter((p) => p.supportsVision);
    const preferredId = candidates[0]?.id ?? "none";
    const errors: string[] = [];

    for (const provider of candidates) {
      const providerStart = Date.now();
      try {
        const response = await provider.analyzeImage(request);
        this.track({
          provider,
          response,
          capability: "vision_analysis",
          taskType: "vision_analysis",
          requestedProviderId: preferredId,
          durationMs: Date.now() - providerStart,
          success: true,
          request
        });
        return response;
      } catch (error) {
        errors.push(`${provider.id}: ${error instanceof Error ? error.message : "failed"}`);
        provider.invalidateHealthCache();
      }
    }

    const mock = this.registry.get("mock");
    const fallbackStart = Date.now();
    const response = mock
      ? await mock.analyzeImage(request).catch(() => buildHardFallback(request))
      : buildHardFallback(request, errors.join("; "));

    const finalResponse = { ...response, fallbackUsed: true };
    this.track({
      provider: mock ?? buildNoneDescriptor(),
      response: finalResponse,
      capability: "vision_analysis",
      taskType: "vision_analysis",
      requestedProviderId: preferredId,
      durationMs: Date.now() - fallbackStart,
      success: false,
      fallbackUsed: true,
      request
    });

    return finalResponse;
  }

  selectCandidates(
    prefOrRequest: ProviderRoutingPreference | ProviderRequest
  ): IProvider[] {
    const required = prefOrRequest.requiredCapabilities;
    const preferredTier = prefOrRequest.preferredCostTier;
    const localOnly =
      "localOnly" in prefOrRequest
        ? prefOrRequest.localOnly
        : this.config.preferLocalModels;
    const allowMock =
      "allowMock" in prefOrRequest ? (prefOrRequest.allowMock ?? true) : true;

    return this.registry
      .list()
      .filter((p) => {
        if (!p.available && p.id !== "mock") return false;
        if (p.id === "mock" && !allowMock) return false;
        if (!this.config.allowCloudFallback && !p.local && p.id !== "mock") return false;
        if (localOnly && !p.local && p.id !== "mock") return false;
        return p.satisfies(required);
      })
      .sort((a, b) => providerSortKey(a, b, preferredTier, this.config.preferLocalModels));
  }

  getProviderDescriptors() {
    return this.registry.listDescriptors();
  }

  async runHealthChecks() {
    return this.registry.checkAll();
  }

  describeFallbackChain(): string {
    const all = this.registry
      .list()
      .sort((a, b) => providerSortKey(a, b, undefined, this.config.preferLocalModels));

    return all
      .filter((p) => {
        if (!this.config.allowCloudFallback && !p.local && p.id !== "mock") return false;
        return true;
      })
      .map((p) => {
        if (p.id === "ollama") return "Local Ollama";
        if (p.id === "openrouter") return "OpenRouter Free";
        if (p.id === "mock") return "Mock (offline)";
        return p.name;
      })
      .join(" → ");
  }

  // ---------------------------------------------------------------------------
  // Usage tracking — private
  // ---------------------------------------------------------------------------

  private track(input: {
    provider: IProvider | ReturnType<typeof buildNoneDescriptor>;
    response: ProviderResponse;
    capability: string;
    taskType: string;
    requestedProviderId: string;
    durationMs: number;
    success: boolean;
    fallbackUsed?: boolean;
    request: ProviderRequest;
  }): void {
    const totalTokens =
      (input.response.usage?.totalTokens ??
        (input.response.usage?.promptTokens ?? 0) +
          (input.response.usage?.completionTokens ?? 0)) ||
      estimateTokensFromContent(input.response.content);

    const event = usageTracker.buildEvent({
      providerId: input.provider.id,
      providerName: input.provider.name,
      providerIsLocal: input.provider.local,
      providerCostTier: input.provider.costTier,
      model: input.response.model,
      capability: input.capability,
      taskType: input.taskType,
      estimatedTokens: totalTokens,
      durationMs: input.durationMs,
      success: input.success,
      fallbackUsed: input.fallbackUsed ?? input.response.fallbackUsed,
      requestedProviderId:
        input.requestedProviderId !== input.provider.id
          ? input.requestedProviderId
          : undefined,
      sessionId: input.request.context.sessionId
    });

    usageTracker.record(event);
  }
}

/** Singleton — import and use throughout the agent layer */
export const providerRouter = new ProviderRouter();

// ---------------------------------------------------------------------------
// Module helpers
// ---------------------------------------------------------------------------

function dispatch(provider: IProvider, request: ProviderRequest): Promise<ProviderResponse> {
  const caps = request.requiredCapabilities;
  if (caps.includes("vision_analysis") && provider.supportsVision) {
    const imageBase64 = (request.meta as Record<string, unknown> | undefined)?.imageBase64;
    if (typeof imageBase64 === "string") {
      return provider.analyzeImage({ ...request, imageBase64 });
    }
  }
  if (caps.includes("chat")) return provider.chat(request);
  if (caps.includes("text_summary")) return provider.summarize(request);
  return provider.generateText(request);
}

function resolveTaskType(request: ProviderRequest): string {
  const caps = request.requiredCapabilities;
  if (caps.includes("vision_analysis")) return "vision_analysis";
  if (caps.includes("research_planning")) return "research_planning";
  if (caps.includes("text_summary")) {
    return (request.meta as Record<string, unknown> | undefined)?.detailed
      ? "detailed_summary"
      : "short_summary";
  }
  if (caps.includes("chat")) return "talkback_answer";
  return "text_generation";
}

function estimateTokensFromContent(content: string): number {
  return Math.ceil(content.length / 4);
}

function providerSortKey(
  a: IProvider,
  b: IProvider,
  preferredTier?: ProviderCostTier,
  preferLocal = false
): number {
  if (a.local && !b.local) return preferLocal ? -2 : -1;
  if (!a.local && b.local) return preferLocal ? 2 : 1;
  if (a.id === "mock") return 1;
  if (b.id === "mock") return -1;
  if (preferredTier) {
    const aMatch = a.costTier === preferredTier ? -1 : 0;
    const bMatch = b.costTier === preferredTier ? -1 : 0;
    if (aMatch !== bMatch) return aMatch - bMatch;
  }
  return TIER_PRIORITY[a.costTier] - TIER_PRIORITY[b.costTier];
}

function buildHardFallback(request: ProviderRequest, errorSummary?: string): ProviderResponse {
  const preview = request.context.extractedText.slice(0, 200);
  return {
    id: `fallback-${Date.now()}`,
    providerId: "none",
    model: "screensmart-hard-fallback",
    content:
      `**ScreenSmart — all providers unavailable**\n\n${preview}\n\n` +
      `_Configure OpenRouter or Ollama to enable AI features._` +
      (errorSummary ? `\n\n_Errors: ${errorSummary}_` : ""),
    createdAt: new Date().toISOString(),
    fallbackUsed: true,
    usage: { estimated: true }
  };
}

/** Minimal descriptor for when no provider was resolved */
function buildNoneDescriptor() {
  return {
    id: "none",
    name: "None (hard fallback)",
    local: false,
    costTier: "free" as ProviderCostTier,
    capabilities: [] as ProviderCapability[],
    supportsVision: false,
    supportsTools: false,
    supportsStreaming: false,
    available: false,
    satisfies: () => false,
    invalidateHealthCache: () => undefined
  };
}
