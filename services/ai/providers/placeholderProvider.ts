import { createId } from "@/utils/createId";

import type { AiProvider, AiProviderRequest, AiResponse } from "../types";

export const placeholderAiProvider: AiProvider = {
  id: "placeholder",
  label: "ScreenSmart placeholder AI",
  async generate(request: AiProviderRequest): Promise<AiResponse> {
    await new Promise((resolve) => setTimeout(resolve, 450));

    return {
      id: createId("ai-response"),
      content: buildMockContent(request),
      createdAt: new Date().toISOString(),
      fallbackUsed: request.preferredModel !== "screensmart-mock-model",
      finishReason: "stop",
      format: "markdown",
      model: "screensmart-mock-model",
      provider: "placeholder",
      streamed: false,
      task: request.task,
      usage: estimateUsage(request.prompt)
    };
  }
};

function buildMockContent(request: AiProviderRequest) {
  const textPreview = request.context.extractedText.slice(0, 500);

  switch (request.task) {
    case "short_summary":
      return `**Short summary**\n\nThis screen appears to contain ${request.context.category.replace("_", " ")} content. Key visible text: "${textPreview}"`;
    case "detailed_summary":
      return `**Detailed summary**\n\nScreenSmart detected ${request.context.category.replace("_", " ")} content in the OCR session.\n\n${textPreview}\n\nUse this as a mock summary until a production AI provider is configured.`;
    case "key_points":
      return `- Detected category: ${request.context.category.replace("_", " ")}\n- OCR text is available for this session\n- Review visible details before acting`;
    case "explain":
      return `**Plain-language explanation**\n\nThis screen likely needs your attention. I am grounding this placeholder explanation in the OCR text: "${textPreview}"`;
    case "talkback_answer":
      return `**Answer**\n\nUsing the current OCR text, here is a contextual mock response to your question.\n\n${textPreview}`;
    default:
      return textPreview;
  }
}

function estimateUsage(prompt: string) {
  const promptTokens = Math.ceil(prompt.length / 4);
  const completionTokens = 120;

  return {
    completionTokens,
    estimated: true,
    promptTokens,
    totalTokens: promptTokens + completionTokens
  };
}
