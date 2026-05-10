import { createId } from "@/utils/createId";

import { SCREENSMART_SYSTEM_PROMPT } from "../prompts/screenPrompts";
import { getFallbackModel, getModelRouteForTask } from "../routing/modelRouter";
import type { AiProvider, AiProviderRequest, AiResponse } from "../types";

type OpenRouterChoice = {
  message?: {
    content?: string;
  };
  finish_reason?: string;
};

type OpenRouterResponse = {
  id?: string;
  choices?: OpenRouterChoice[];
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

type AiProxyResponse = Omit<OpenRouterResponse, "usage"> & {
  content?: string;
  finishReason?: string;
  usage?: OpenRouterResponse["usage"] & {
    completionTokens?: number;
    estimated?: boolean;
    promptTokens?: number;
    totalTokens?: number;
  };
};

export const openRouterProvider: AiProvider = {
  id: "openrouter",
  label: "OpenRouter",
  async generate(request: AiProviderRequest): Promise<AiResponse> {
    const proxyUrl = getAiProxyUrl();

    if (!proxyUrl) {
      throw new Error("AI proxy endpoint is not configured.");
    }

    const modelRoute = request.preferredModels?.length
      ? {
          fallbacks: request.preferredModels.slice(1),
          primary: request.preferredModels[0]
        }
      : getModelRouteForTask("openrouter", request.task);
    const model = request.preferredModel || modelRoute.primary;
    const response = await fetch(proxyUrl, {
      body: JSON.stringify({
        context: request.context,
        fallbackModels: modelRoute.fallbacks,
        history: request.history ?? [],
        messages: [
          {
            role: "system",
            content: SCREENSMART_SYSTEM_PROMPT
          },
          ...(request.history ?? []).slice(-8).map((message) => ({
            role: message.role === "assistant" ? "assistant" : "user",
            content: message.body
          })),
          {
            role: "user",
            content: request.prompt
          }
        ],
        model,
        preferredModel: model,
        prompt: request.prompt,
        provider: "openrouter",
        task: request.task,
        temperature: 0.2
      }),
      headers: {
        "Content-Type": "application/json",
        "X-ScreenSmart-App": "mobile-mvp"
      },
      method: "POST"
    });

    if (!response.ok) {
      throw new Error(`AI proxy request failed with status ${response.status}.`);
    }

    const data = (await response.json()) as AiProxyResponse;
    const content = normalizeContent(data);

    if (!content) {
      throw new Error("AI proxy returned an empty response.");
    }

    return {
      id: data.id || createId("ai-response"),
      content,
      createdAt: new Date().toISOString(),
      finishReason: data.finishReason || data.choices?.[0]?.finish_reason,
      format: "markdown",
      model: data.model || model,
      provider: "openrouter",
      streamed: false,
      task: request.task,
      usage: {
        completionTokens: data.usage?.completionTokens ?? data.usage?.completion_tokens,
        estimated: !data.usage,
        promptTokens: data.usage?.promptTokens ?? data.usage?.prompt_tokens,
        totalTokens: data.usage?.totalTokens ?? data.usage?.total_tokens
      }
    };
  },

  async *stream() {
    yield {
      id: createId("ai-stream"),
      contentDelta: "",
      done: true
    };
  }
};

export function getOpenRouterFallbackModel() {
  return getFallbackModel("openrouter");
}

function getAiProxyUrl() {
  return process.env.EXPO_PUBLIC_AI_PROXY_URL || process.env.EXPO_PUBLIC_OPENROUTER_PROXY_URL;
}

function normalizeContent(data: AiProxyResponse) {
  if (typeof data.content === "string") {
    return data.content.trim();
  }

  return data.choices?.[0]?.message?.content?.trim();
}
