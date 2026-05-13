import { aiService, type AiResponse } from "@/services/ai";
import type { ScreenSession } from "@/types/screenSession";

import { BaseAgent } from "../core/BaseAgent";

type ExplainAgentInput = {
  session: ScreenSession;
};

export class ExplainAgent extends BaseAgent<ExplainAgentInput, AiResponse> {
  constructor() {
    super({
      id: "screensmart.explain",
      name: "ExplainAgent",
      department: "screensmart",
      role: "Explain OCR screen content",
      description: "Explains the current screen in plain language through the existing AI abstraction."
    });
  }

  run(input: ExplainAgentInput) {
    return aiService.explain(input.session);
  }

  protected safeFallback(input: ExplainAgentInput): AiResponse {
    return {
      id: `${input.session.id}-explain-fallback`,
      content: "I can explain this screen once OCR context is available. This is a safe fallback explanation.",
      createdAt: new Date().toISOString(),
      fallbackUsed: true,
      format: "markdown",
      model: "screensmart-agent-fallback",
      provider: "placeholder",
      streamed: false,
      task: "explain",
      usage: { estimated: true }
    };
  }
}
