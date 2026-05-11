import { aiService, type AiResponse } from "@/services/ai";
import type { ScreenSession } from "@/types/screenSession";

import { BaseAgent } from "../core/BaseAgent";
import type { AgentContext } from "../core/AgentTypes";

type SummaryAgentInput = {
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
      description: "Uses the existing AI provider abstraction and ai-proxy fallback path to summarize screens."
    });
  }

  run(input: SummaryAgentInput) {
    return aiService.summarize(input.session, input.style ?? "short");
  }

  protected safeFallback(input: SummaryAgentInput, context: AgentContext): AiResponse {
    const text = input.session.ocr?.extractedText ?? context.ocr?.extractedText ?? "No OCR text available.";

    return {
      id: `${input.session.id}-summary-fallback`,
      content: `**Screen summary**\n\n${text.slice(0, 280)}\n\n_AI summary fallback used._`,
      createdAt: new Date().toISOString(),
      fallbackUsed: true,
      format: "markdown",
      model: "screensmart-agent-fallback",
      provider: "placeholder",
      streamed: false,
      task: input.style === "detailed" ? "detailed_summary" : "short_summary",
      usage: {
        estimated: true
      }
    };
  }
}
