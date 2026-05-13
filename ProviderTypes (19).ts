import { BaseAgent } from "../core/BaseAgent";

export class WebSearchAgent extends BaseAgent<{ query?: string }, { message: string }> {
  constructor() {
    super({
      id: "research.web-search",
      name: "WebSearchAgent",
      department: "research",
      role: "Prepare web search tasks",
      description: "Safe stub for future web search capability; does not browse in the mobile MVP."
    });
  }

  async run() {
    return { message: "Web search is not active in this MVP. Use saved OCR context and AI summaries." };
  }
}
