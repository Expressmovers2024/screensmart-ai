/**
 * SummaryAgent — capability-based, vendor-agnostic.
 *
 * Requests: text_summary, low_cost
 * Does NOT import OpenRouter, Ollama, or any specific provider.
 * ProviderRouter selects the best available provider at runtime.
 */

import { providerRouter } from "@/src/providers";
import type { ProviderResponse } from "@/src/providers";
import type { AiResponse } from "@/services/ai/types";
import { createOcrContext } from "@/services/ai/aiChatService";
import { buildScreenPrompt } from "@/services/ai/prompts/screenPrompts";
import { getSafeAiContext } from "@/services/ai/utils/chunkText";
import type { ScreenSession } from "@/types/screenSession";

import { BaseAgent } from "../core/BaseAgent";
import type { AgentContext } from "../core/AgentTypes";

export type SummaryAgentInput = {
  session: ScreenSession;
  style?: "short" | "detailed";
};

export class SummaryAgent extends BaseAgent<SummaryAgentInput, AiResponse> {
  constructor() {
    super({
      id: "screensmart.summary",
      name: "SummaryAgent",
      department: "screensmart",
      role: "Generate OCR-grounded summaries",
      description:
        "Requests text_summary + low_cost capabilities. " +
        "ProviderRouter selects: Ollama → OpenRouter → Mock."
    });
  }

  async run(input: SummaryAgentInput, context: AgentContext): Promise<AiResponse> {
    const rawText =
      context.ocr?.extractedText ??
      input.session.ocr?.extractedText ??
      input.session.summary ??
      "No OCR text available.";

    const safe = getSafeAiContext(rawText);
    const ocrContext = createOcrContext({
      confidence: input.session.ocr?.confidence,
      extractedText: safe.wasTruncated
        ? `${safe.truncatedText}\n\n[Content truncated.]`
        : safe.truncatedText,
      sessionId: input.session.id
    });

    const task =
      input.style === "detailed" ? "detailed_summary" : "short_summary";

    const prompt = buildScreenPrompt({ context: ocrContext, task });

    const response = await providerRouter.route({
      requiredCapabilities: ["text_summary", "low_cost"],
      preferredCostTier: "free",
      prompt,
      context: ocrContext,
      meta: { detailed: input.style === "detailed" }
    });

    return toAiResponse(response, task);
  }

  protected safeFallback(
    input: SummaryAgentInput,
    context: AgentContext
  ): AiResponse {
    const text =
      context.ocr?.extractedText ??
      input.session.ocr?.extractedText ??
      "No OCR text.";
    return {
      id: `${input.session.id}-summary-fallback`,
      content: `**Screen summary**\n\n${text.slice(0, 280)}\n\n_All providers unavailable._`,
      createdAt: new Date().toISOString(),
      fallbackUsed: true,
      format: "markdown",
      model: "screensmart-agent-fallback",
      provider: "placeholder",
      streamed: false,
      task: input.style === "detailed" ? "detailed_summary" : "short_summary",
      usage: { estimated: true }
    };
  }
}

function toAiResponse(
  r: ProviderResponse,
  task: AiResponse["task"]
): AiResponse {
  return {
    id: r.id,
    content: r.content,
    createdAt: r.createdAt,
    fallbackUsed: r.fallbackUsed,
    finishReason: r.finishReason,
    format: "markdown",
    model: r.model,
    provider: r.providerId as AiResponse["provider"],
    streamed: false,
    task,
    usage: r.usage
  };
}
