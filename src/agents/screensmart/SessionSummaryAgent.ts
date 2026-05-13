/**
 * SessionSummaryAgent (formerly MemoryAgent)
 *
 * Renamed to reflect what this agent actually does: compute a structured
 * in-session summary that the Orchestrator uses for titles, tags, and
 * workflow checkpoints. It does NOT persist data — that is the job of
 * storageService via MissionPlannerAgent.
 *
 * Future cross-session memory persistence should be a new MemoryAgent
 * that reads/writes to a dedicated `memories` table in Supabase, keyed
 * by userId + topic embedding.
 */

import { BaseAgent } from "../core/BaseAgent";
import type { AgentRun, ScreenIntelligenceOutput, WorkflowCheckpoint } from "../core/AgentTypes";

export type SessionSummaryInput = {
  sessionId: string;
  intelligence?: ScreenIntelligenceOutput;
  timeline: AgentRun[];
  summary?: string;
  workflowCheckpoints?: WorkflowCheckpoint[];
};

export type SessionSummaryOutput = {
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

export class SessionSummaryAgent extends BaseAgent<SessionSummaryInput, SessionSummaryOutput> {
  constructor() {
    super({
      id: "screensmart.session-summary",
      name: "SessionSummaryAgent",
      department: "screensmart",
      role: "Compute session summary for orchestration",
      description:
        "Derives title, tags, and key entities from ScreenIntelligence. " +
        "Does not persist data — MissionPlannerAgent handles persistence."
    });
  }

  async run(input: SessionSummaryInput): Promise<SessionSummaryOutput> {
    const { intelligence } = input;
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
      summary:
        input.summary ?? intelligence?.summary ?? "Screen session captured.",
      tags,
      timelineCount: input.timeline.length,
      workflowCheckpoints: input.workflowCheckpoints ?? []
    };
  }
}

function buildSessionTitle(screenType: string, detectedTask: string): string {
  return `${screenType}: ${detectedTask}`.slice(0, 80);
}

function buildTags(
  screenType: string,
  detectedTask: string,
  entities: string[]
): string[] {
  return Array.from(
    new Set([
      screenType.toLowerCase().replace(/\s+/g, "-"),
      ...detectedTask
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 4)
        .slice(0, 3),
      ...entities.slice(0, 3).map((e) => e.toLowerCase().replace(/\s+/g, "-"))
    ])
  ).slice(0, 8);
}
