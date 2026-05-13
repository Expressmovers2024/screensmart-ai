/**
 * OpenAIProvider — SCAFFOLD ONLY. Not implemented.
 *
 * To implement:
 *   1. Add `EXPO_PUBLIC_OPENAI_API_KEY` to your .env
 *   2. Replace each `throw NOT_IMPLEMENTED` with real fetch calls to
 *      https://api.openai.com/v1/chat/completions
 *   3. Set `available = true` and register in ProviderRegistry
 *   4. Update costTier to "cheap" or "premium" depending on chosen model
 */

import { BaseProvider } from "../BaseProvider";
import type {
  ProviderCapability,
  ProviderHealthStatus,
  ProviderRequest,
  ProviderResponse
} from "../ProviderTypes";

const NOT_IMPLEMENTED = new Error(
  "OpenAIProvider is not implemented yet. See src/providers/scaffolds/OpenAIProvider.ts."
);

export class OpenAIProvider extends BaseProvider {
  id = "openai" as const;
  name = "OpenAI";
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
  /** Set to true once EXPO_PUBLIC_OPENAI_API_KEY is configured */
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
    return this.buildHealthStatus(false, 0, "OpenAI provider not yet implemented");
  }
}
