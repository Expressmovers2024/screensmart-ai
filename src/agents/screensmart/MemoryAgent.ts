import { BaseAgent } from "../core/BaseAgent";
import type { AgentRun, ScreenIntelligenceOutput } from "../core/AgentTypes";

type MemoryAgentInput = {
  sessionId: string;
  intelligence?: ScreenIntelligenceOutput;
  timeline: AgentRun[];
};

type MemoryAgentOutput = {
  remembered: boolean;
  sessionId: string;
  timelineCount: number;
  summary: string;
};

export class MemoryAgent extends BaseAgent<MemoryAgentInput, MemoryAgentOutput> {
  constructor() {
    super({
      id: "screensmart.memory",
      name: "MemoryAgent",
      department: "screensmart",
      role: "Prepare session memory",
      description: "Summarizes what should be persisted locally for the current ScreenSmart session."
    });
  }

  async run(input: MemoryAgentInput): Promise<MemoryAgentOutput> {
    return {
      remembered: true,
      sessionId: input.sessionId,
      summary: input.intelligence?.summary ?? "Screen session captured.",
      timelineCount: input.timeline.length
    };
  }
}
