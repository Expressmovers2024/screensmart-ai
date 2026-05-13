/**
 * OpenRouterProvider — routes through the ai-proxy Edge Function.
 *
 * Priority: SECOND — after local Ollama, before mock.
 * Cost tier: free — only free/:free-suffixed models are permitted.
 *
 * This provider wraps the existing openrouterProvider from services/ai/providers
 * and adapts it to the new IProvider interface so the ProviderRouter can manage it.
 */

import { SCREENSMART_SYSTEM_PROMPT } from "@/services/ai/prompts/screenPrompts";
import { getModelRouteForTask } from "@/services/ai/routing/modelRouter";
import type { AiTask } from "@/services/ai/types";
import { createId } from "@/utils/createId";

import { BaseProvider } from "../BaseProvider";
import type {
  ProviderCapability,
  ProviderHealthStatus,
  ProviderRequest,
  ProviderResponse
} from "../ProviderTypes";

const REQUEST_TIMEOUT_MS = 25_000;

type ProxyResponse = {
  id?: string;
  content?: string;
  model?: string;
  finishReason?: string;
  choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

export class OpenRouterProvider extends BaseProvider {
  id = "openrouter" as const;
  name = "OpenRouter (free)";
  capabilities: ProviderCapability[] = [
    "text_generation",
    "text_summary",
    "vision_analysis",
    "chat",
    "research_planning",
    "low_cost"
  ];
  supportsVision = true;
  supportsTools = false;
  supportsStreaming = false;
  local = false;
  costTier = "free" as const;
  available = true; // assumed available until health check fails

  async generateText(request: ProviderRequest): Promise<ProviderResponse> {
    const proxyUrl = getProxyUrl();
    if (!proxyUrl) throw new Error("AI proxy URL is not configured.");

    const task = resolveTask(request);
    const modelRoute = request.modelOverride
      ? { primary: request.modelOverride, fallbacks: [] }
      : getModelRouteForTask("openrouter", task);

    const body = buildRequestBody(request, modelRoute.primary, modelRoute.fallbacks, task);
    const data = await proxyFetch(proxyUrl, body);
    const content = extractContent(data);

    if (!content) throw new Error("OpenRouter returned empty content.");

    return this.buildResponse(content, data.model ?? modelRoute.primary, request, {
      id: data.id ?? createId("openrouter-response"),
      finishReason: data.finishReason ?? data.choices?.[0]?.finish_reason,
      fallbackUsed: false,
      usage: {
        completionTokens: data.usage?.completionTokens ?? data.usage?.completion_tokens,
        promptTokens: data.usage?.promptTokens ?? data.usage?.prompt_tokens,
        totalTokens: data.usage?.totalTokens ?? data.usage?.total_tokens,
        estimated: !data.usage
      }
    });
  }

  async analyzeImage(
    request: ProviderRequest & { imageBase64: string; mimeType?: string }
  ): Promise<ProviderResponse> {
    const proxyUrl = getProxyUrl();
    if (!proxyUrl) throw new Error("AI proxy URL is not configured.");

    const modelRoute = getModelRouteForTask("openrouter", "vision_analysis");
    const body = {
      ...buildRequestBody(request, modelRoute.primary, modelRoute.fallbacks, "vision_analysis"),
      image: {
        base64: request.imageBase64,
        mimeType: request.mimeType ?? "image/jpeg"
      }
    };

    const data = await proxyFetch(proxyUrl, body);
    const content = extractContent(data);
    if (!content) throw new Error("OpenRouter vision returned empty content.");

    return this.buildResponse(content, data.model ?? modelRoute.primary, request, {
      fallbackUsed: false
    });
  }

  async healthCheck(): Promise<ProviderHealthStatus> {
    const start = Date.now();
    const proxyUrl = getProxyUrl();

    if (!proxyUrl) {
      this.available = false;
      return this.buildHealthStatus(false, 0, "EXPO_PUBLIC_AI_PROXY_URL not configured");
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5_000);
      const res = await fetch(proxyUrl, {
        method: "OPTIONS",
        signal: controller.signal
      });
      clearTimeout(timeout);

      this.available = res.ok || res.status === 204 || res.status === 405;
      return this.buildHealthStatus(this.available, Date.now() - start);
    } catch (error) {
      this.available = false;
      return this.buildHealthStatus(
        false,
        Date.now() - start,
        error instanceof Error ? error.message : "Proxy unreachable"
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getProxyUrl(): string | null {
  return (
    process.env.EXPO_PUBLIC_AI_PROXY_URL ??
    process.env.EXPO_PUBLIC_OPENROUTER_PROXY_URL ??
    null
  );
}

function resolveTask(request: ProviderRequest): AiTask {
  const caps = request.requiredCapabilities;
  if (caps.includes("vision_analysis")) return "vision_analysis";
  if (caps.includes("research_planning")) return "research_planning";
  if (caps.includes("text_summary")) {
    const meta = request.meta as Record<string, unknown> | undefined;
    return meta?.detailed === true ? "detailed_summary" : "short_summary";
  }
  if (caps.includes("chat")) return "talkback_answer";
  return "short_summary";
}

function buildRequestBody(
  request: ProviderRequest,
  model: string,
  fallbacks: string[],
  task: AiTask
) {
  return {
    context: request.context,
    fallbackModels: fallbacks,
    history: request.history ?? [],
    messages: [
      { role: "system", content: SCREENSMART_SYSTEM_PROMPT },
      ...(request.history ?? []).slice(-8).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.body
      })),
      { role: "user", content: request.prompt }
    ],
    model,
    preferredModel: model,
    prompt: request.prompt,
    provider: "openrouter",
    task,
    temperature: request.temperature ?? 0.2
  };
}

async function proxyFetch(url: string, body: unknown): Promise<ProxyResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ScreenSmart-App": "mobile-provider-layer"
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
    return (await res.json()) as ProxyResponse;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("OpenRouter proxy request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function extractContent(data: ProxyResponse): string | undefined {
  if (typeof data.content === "string") return data.content.trim();
  return data.choices?.[0]?.message?.content?.trim();
}
