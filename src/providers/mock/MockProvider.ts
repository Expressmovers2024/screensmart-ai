/**
 * MockProvider — always-available safe fallback provider.
 *
 * Priority: LAST — only used when all real providers fail.
 * Never throws. Returns structured placeholder content.
 * Clearly labels responses as mock so the user is informed.
 */

import { createId } from "@/utils/createId";

import { BaseProvider } from "../BaseProvider";
import type {
  ProviderCapability,
  ProviderHealthStatus,
  ProviderRequest,
  ProviderResponse
} from "../ProviderTypes";

export class MockProvider extends BaseProvider {
  id = "mock" as const;
  name = "ScreenSmart Mock";
  capabilities: ProviderCapability[] = [
    "text_generation",
    "text_summary",
    "vision_analysis",
    "chat",
    "research_planning",
    "fast_response",
    "low_cost"
  ];
  supportsVision = true; // returns mock content for images too
  supportsTools = false;
  supportsStreaming = false;
  local = true;
  costTier = "free" as const;
  available = true; // always available

  async generateText(request: ProviderRequest): Promise<ProviderResponse> {
    await simulateLatency();
    return this.buildResponse(buildMockContent(request), "screensmart-mock", request, {
      fallbackUsed: true
    });
  }

  async analyzeImage(
    request: ProviderRequest & { imageBase64: string }
  ): Promise<ProviderResponse> {
    await simulateLatency();
    return this.buildResponse(
      `**Mock vision analysis**\n\nImage received. ` +
        `Configure a real provider to get AI-powered screen intelligence.\n\n` +
        buildMockContent(request),
      "screensmart-mock-vision",
      request,
      { fallbackUsed: true }
    );
  }

  async summarize(request: ProviderRequest): Promise<ProviderResponse> {
    await simulateLatency();
    const preview = request.context.extractedText.slice(0, 300);
    return this.buildResponse(
      `**Screen summary** _(mock)_\n\n${preview}\n\n_Configure a real AI provider for production summaries._`,
      "screensmart-mock",
      request,
      { fallbackUsed: true }
    );
  }

  async chat(request: ProviderRequest): Promise<ProviderResponse> {
    await simulateLatency();
    return this.buildResponse(
      `**Mock TalkBack response**\n\n` +
        `I'm a placeholder. Configure OpenRouter or Ollama to get real answers.\n\n` +
        `Your question: _"${request.prompt.slice(0, 120)}"_`,
      "screensmart-mock",
      request,
      { fallbackUsed: true }
    );
  }

  async healthCheck(): Promise<ProviderHealthStatus> {
    return this.buildHealthStatus(true, 0);
  }
}

function buildMockContent(request: ProviderRequest): string {
  const caps = request.requiredCapabilities;
  const preview = request.context.extractedText.slice(0, 400);
  const category = request.context.category.replace("_", " ");

  if (caps.includes("text_summary")) {
    return (
      `**Summary** _(mock provider)_\n\n` +
      `Detected ${category} content. Key text: "${preview}"\n\n` +
      `_Real AI summary requires OpenRouter or Ollama._`
    );
  }
  if (caps.includes("research_planning")) {
    return (
      `**Research plan** _(mock provider)_\n\n` +
      `Search for: "${preview.slice(0, 80)}"\n\n` +
      `_Real research planning requires OpenRouter._`
    );
  }
  if (caps.includes("vision_analysis")) {
    return `**Vision** _(mock)_\n\nOCR text: "${preview}"`;
  }
  return `_(mock)_ ${preview}`;
}

function simulateLatency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 80));
}
