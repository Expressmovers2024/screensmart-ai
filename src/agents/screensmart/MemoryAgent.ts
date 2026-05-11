import { BaseAgent } from "../core/BaseAgent";
import type { AgentRun, ScreenIntelligenceOutput, WorkflowCheckpoint } from "../core/AgentTypes";

type MemoryAgentInput = {
  sessionId: string;
  intelligence?: ScreenIntelligenceOutput;
  timeline: AgentRun[];
  summary?: string;
  workflowCheckpoints?: WorkflowCheckpoint[];
};

type MemoryAgentOutput = {
  detectedTask: string;
  keyEntities: string[];
  lastActiveAt: string;
  remembered: boolean;
  sessionId: string;
  sessionTitle: string;
  screenType: string;
  summary: string;
  tags: string[];
  timelineCount: number;
  workflowCheckpoints: WorkflowCheckpoint[];
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
    const intelligence = input.intelligence;
    const screenType = intelligence?.screenType ?? "General screen";
    const detectedTask = intelligence?.detectedTask ?? "Review captured screen";
    const tags = buildTags(screenType, detectedTask, intelligence?.keyEntities ?? []);

    return {
      detectedTask,
      keyEntities: intelligence?.keyEntities ?? [],
      lastActiveAt: new Date().toISOString(),
      remembered: true,
      sessionId: input.sessionId,
      sessionTitle: buildSessionTitle(screenType, detectedTask),
      screenType,
      summary: input.summary ?? intelligence?.summary ?? "Screen session captured.",
      tags,
      timelineCount: input.timeline.length,
      workflowCheckpoints: input.workflowCheckpoints ?? []
    };
  }
}

function buildSessionTitle(screenType: string, detectedTask: string) {
  return `${screenType}: ${detectedTask}`.slice(0, 80);
}

function buildTags(screenType: string, detectedTask: string, entities: string[]) {
  return Array.from(
    new Set([
      screenType.toLowerCase().replace(/\s+/g, "-"),
      ...detectedTask
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 4)
        .slice(0, 3),
      ...entities.slice(0, 3).map((entity) => entity.toLowerCase().replace(/\s+/g, "-"))
    ])
  ).slice(0, 8);
}
