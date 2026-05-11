import { createId } from "@/utils/createId";

import type { AgentRun, AgentStatus } from "./AgentTypes";

export class AgentTimeline {
  private runs: AgentRun[] = [];

  start(input: {
    sessionId: string;
    agentId: string;
    agentName: string;
    input: any;
    inputSummary?: string;
  }) {
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

  complete(runId: string, status: AgentStatus, output: any, error?: string) {
    const completedAt = new Date().toISOString();

    this.runs = this.runs.map((run) =>
      run.id === runId
        ? {
            ...run,
            completedAt,
            confidence: extractConfidence(output),
            durationMs: new Date(completedAt).getTime() - new Date(run.startedAt).getTime(),
            error,
            output,
            outputSummary: error ?? summarizePayload(output),
            status
          }
        : run
    );

    return this.runs.find((run) => run.id === runId);
  }

  list() {
    return this.runs;
  }

  merge(runs: AgentRun[]) {
    this.runs = [...this.runs, ...runs];
  }
}

function summarizePayload(payload: unknown) {
  if (!payload) {
    return "No payload.";
  }

  if (typeof payload === "string") {
    return payload.slice(0, 180);
  }

  if (typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const summary = record.summary ?? record.content ?? record.message ?? record.detectedTask ?? record.title ?? record.extractedText;

    if (typeof summary === "string") {
      return summary.slice(0, 180);
    }

    const keys = Object.keys(record).slice(0, 5);
    return keys.length > 0 ? `Fields: ${keys.join(", ")}` : "Object payload.";
  }

  return String(payload);
}

function extractConfidence(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const confidence = (payload as Record<string, unknown>).confidence;

  return typeof confidence === "number" ? confidence : undefined;
}
