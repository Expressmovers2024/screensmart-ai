import { createId } from "@/utils/createId";

import { SCREENSMART_SYSTEM_PROMPT } from "../prompts/screenPrompts";
import { getFallbackModel, getModelForTask } from "../routing/modelRouter";
import type { AiProvider, AiProviderRequest, AiResponse } from "../types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

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

export const openRouterProvider: AiProvider = {
  id: "openrouter",
  label: "OpenRouter",
  async generate(request: AiProviderRequest): Promise<AiResponse> {
    const apiKey = getOpenRouterApiKey();

    if (!apiKey) {
      throw new Error("OpenRouter API key is not configured.");
    }

    const model = request.preferredModel || getModelForTask("openrouter", request.task);
    const response = await fetch(OPENROUTER_URL, {
      body: JSON.stringify({
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
        temperature: 0.2
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.EXPO_PUBLIC_APP_URL || "https://screensmart.ai",
        "X-Title": "ScreenSmart AI"
      },
      method: "POST"
    });

    if (!response.ok) {
      throw new Error(`OpenRouter request failed with status ${response.status}.`);
    }

    const data = (await response.json()) as OpenRouterResponse;
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("OpenRouter returned an empty response.");
    }

    return {
      id: data.id || createId("ai-response"),
      content,
      createdAt: new Date().toISOString(),
      finishReason: data.choices?.[0]?.finish_reason,
      format: "markdown",
      model: data.model || model,
      provider: "openrouter",
      streamed: false,
      task: request.task,
      usage: {
        completionTokens: data.usage?.completion_tokens,
        estimated: !data.usage,
        promptTokens: data.usage?.prompt_tokens,
        totalTokens: data.usage?.total_tokens
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

function getOpenRouterApiKey() {
  return process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
}
