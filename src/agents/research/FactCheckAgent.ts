import { BaseAgent } from "../core/BaseAgent";

export class FactCheckAgent extends BaseAgent<{ claim?: string }, { message: string }> {
  constructor() {
    super({
      id: "research.fact-check",
      name: "FactCheckAgent",
      department: "research",
      role: "Prepare fact-check tasks",
      description: "Safe stub for future fact-check workflows that will require external sources."
    });
  }

  async run() {
    return { message: "Fact checking is queued for future research tooling and is not active in this MVP." };
  }
}
