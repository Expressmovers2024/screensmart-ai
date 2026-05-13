/**
 * AnthropicProvider — SCAFFOLD ONLY. Not implemented.
 *
 * To implement:
 *   1. Add `EXPO_PUBLIC_ANTHROPIC_API_KEY` to your .env
 *   2. Replace each `throw NOT_IMPLEMENTED` with real fetch calls to
 *      https://api.anthropic.com/v1/messages
 *   3. Set `available = true` and register in ProviderRegistry
 */

import { BaseProvider } from "../BaseProvider";
import type {
  ProviderCapability,
  ProviderHealthStatus,
  ProviderRequest,
  ProviderResponse
} from "../ProviderTypes";

const NOT_IMPLEMENTED = new Error(
  "AnthropicProvider is not implemented yet. See src/providers/scaffolds/AnthropicProvider.ts."
);

export class AnthropicProvider extends BaseProvider {
  id = "anthropic" as const;
  name = "Anthropic Claude";
  capabilities: ProviderCapability[] = [
    "text_generation",
    "text_summary",
    "vision_analysis",
    "chat",
    "research_planning",
    "streaming"
  ];
  supportsVision = true;
  supportsTools = true;
  supportsStreaming = true;
  local = false;
  costTier = "premium" as const;
  available = false;

  async generateText(_request: ProviderRequest): Promise<ProviderResponse> {
    throw NOT_IMPLEMENTED;
  }

  async analyzeImage(
    _request: ProviderRequest & { imageBase64: string }
  ): Promise<ProviderResponse> {
    throw NOT_IMPLEMENTED;
  }

  async healthCheck(): Promise<ProviderHealthStatus> {
    return this.buildHealthStatus(false, 0, "Anthropic provider not yet implemented");
  }
}
