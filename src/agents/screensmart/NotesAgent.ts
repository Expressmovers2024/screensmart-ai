import type { ScreenIntelligenceOutput } from "../core/AgentTypes";
import { BaseAgent } from "../core/BaseAgent";

type NotesAgentInput = {
  sessionId: string;
  summary?: string;
  intelligence?: ScreenIntelligenceOutput;
};

type NotesAgentOutput = {
  title: string;
  bullets: string[];
};

export class NotesAgent extends BaseAgent<NotesAgentInput, NotesAgentOutput> {
  constructor() {
    super({
      id: "screensmart.notes",
      name: "NotesAgent",
      department: "screensmart",
      role: "Prepare session notes",
      description: "Creates lightweight local notes from Screen Intelligence and summary output."
    });
  }

  async run(input: NotesAgentInput): Promise<NotesAgentOutput> {
    const actions = input.intelligence?.suggestedActions ?? [];

    return {
      bullets: [
        input.intelligence?.detectedTask ?? "Review captured screen",
        input.summary?.slice(0, 160) ?? input.intelligence?.summary ?? "No summary generated yet.",
        actions.length > 0 ? `Suggested: ${actions.slice(0, 3).join(", ")}` : "Suggested: Generate summary"
      ],
      title: `${input.intelligence?.screenType ?? "Screen"} notes`
    };
  }
}
