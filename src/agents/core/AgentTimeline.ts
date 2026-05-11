import { createId } from "@/utils/createId";

import type { AgentRun, AgentStatus } from "./AgentTypes";

export class AgentTimeline {
  private runs: AgentRun[] = [];

  start(input: {
    sessionId: string;
    agentId: string;
    agentName: string;
    input: any;
  }) {
    const run: AgentRun = {
      id: createId("agent-run"),
      agentId: input.agentId,
      agentName: input.agentName,
      input: input.input,
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
            error,
            output,
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
