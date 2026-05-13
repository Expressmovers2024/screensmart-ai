import { createId } from "@/utils/createId";

import type { AgentRun, AgentStatus } from "./AgentTypes";

/**
 * AgentTimeline — per-session ordered log of agent runs.
 *
 * Fix: merge() deduplicates by run ID so nested agent calls that share
 * a context object don't produce duplicate timeline entries.
 */
export class AgentTimeline {
  private runs: AgentRun[] = [];

  start(input: {
    sessionId: string;
    agentId: string;
    agentName: string;
    input: unknown;
    inputSummary?: string;
  }): AgentRun {
    const run: AgentRun = {
      id: createId("agent-run"),
      agentId: input.agentId,
      agentName: input.agentName,
      input: input.input,
      inputSummary: input.inputSummary ?? summarizePayload(input.input),
      output: null,
      sessionId: input.sessionId,
      startedAt: new Date().toISOString(),
      status: "running"
    };

    this.runs = [...this.runs, run];
    return run;
  }

  complete(
    runId: string,
    status: AgentStatus,
    output: unknown,
    error?: string
  ): AgentRun | undefined {
    const completedAt = new Date().toISOString();

    this.runs = this.runs.map((run) =>
      run.id === runId
        ? {
            ...run,
            completedAt,
            confidence: extractConfidence(output),
            durationMs:
              new Date(completedAt).getTime() - new Date(run.startedAt).getTime(),
            error,
            output,
            outputSummary: error ?? summarizePayload(output),
            status
          }
        : run
    );

    return this.runs.find((run) => run.id === runId);
  }

  list(): AgentRun[] {
    return this.runs;
  }

  /**
   * Merges runs from a prior context snapshot without producing duplicates.
   * Uses run ID as the deduplication key.
   */
  merge(runs: AgentRun[]): void {
    const existingIds = new Set(this.runs.map((r) => r.id));
    const newRuns = runs.filter((r) => !existingIds.has(r.id));
    this.runs = [...this.runs, ...newRuns];
  }
}

function summarizePayload(payload: unknown): string {
  if (!payload) return "No payload.";
  if (typeof payload === "string") return payload.slice(0, 180);

  if (typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const summary =
      record.summary ??
      record.content ??
      record.message ??
      record.detectedTask ??
      record.title ??
      record.extractedText;

    if (typeof summary === "string") return summary.slice(0, 180);

    const keys = Object.keys(record).slice(0, 5);
    return keys.length > 0 ? `Fields: ${keys.join(", ")}` : "Object payload.";
  }

  return String(payload);
}

function extractConfidence(payload: unknown): number | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const c = (payload as Record<string, unknown>).confidence;
  return typeof c === "number" ? c : undefined;
}
