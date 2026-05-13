import { storageService, type Mission } from "@/services/storage";
import type { ScreenSession } from "@/types/screenSession";
import { createId } from "@/utils/createId";

import { BaseAgent } from "../core/BaseAgent";
import type { WorkflowCheckpoint } from "../core/AgentTypes";

type MissionPlannerInput = {
  session: ScreenSession;
  checkpoint?: WorkflowCheckpoint;
  existingMission?: Mission;
};

type MissionPlannerOutput = {
  mission: Mission;
  requiredAgents: string[];
};

export class MissionPlannerAgent extends BaseAgent<MissionPlannerInput, MissionPlannerOutput> {
  constructor() {
    super({
      id: "screensmart.mission-planner",
      name: "MissionPlannerAgent",
      department: "screensmart",
      role: "Turn screen sessions into missions",
      description: "Creates or updates local missions from ScreenSmart sessions and workflow checkpoints."
    });
  }

  async run(input: MissionPlannerInput): Promise<MissionPlannerOutput> {
    const now = new Date().toISOString();
    const requiredAgents = getRequiredAgents(input.session);
    const existingMission = input.existingMission;
    const checkpointIds = unique([
      ...(existingMission?.checkpointIds ?? []),
      ...(input.checkpoint ? [input.checkpoint.id] : input.session.workflowCheckpoints?.map((checkpoint) => checkpoint.id) ?? [])
    ]);
    const nextActions = input.checkpoint?.nextActions ?? input.session.screenIntelligence?.suggestedActions ?? ["Continue this task"];
    const mission: Mission = {
      id: existingMission?.id ?? createId("mission"),
      agentsUsed: unique([...(existingMission?.agentsUsed ?? []), ...requiredAgents]),
      checkpointIds,
      createdAt: existingMission?.createdAt ?? now,
      description: buildMissionDescription(input.session),
      nextActions,
      sessionIds: unique([...(existingMission?.sessionIds ?? []), input.session.id]),
      status: existingMission?.status === "blocked" ? "blocked" : "active",
      title: buildMissionTitle(input.session),
      updatedAt: now
    };

    return {
      mission: await storageService.saveMission(mission),
      requiredAgents
    };
  }

  protected safeFallback(input: MissionPlannerInput): MissionPlannerOutput {
    const now = new Date().toISOString();
    const mission: Mission = {
      id: input.existingMission?.id ?? createId("mission"),
      agentsUsed: ["MissionPlannerAgent", "OrchestratorAgent"],
      checkpointIds: input.checkpoint ? [input.checkpoint.id] : [],
      createdAt: input.existingMission?.createdAt ?? now,
      description: "Fallback mission created so the workflow can continue safely.",
      nextActions: input.checkpoint?.nextActions ?? ["Review summary", "Ask TalkBack", "Save to library"],
      sessionIds: [input.session.id],
      status: "active",
      title: input.session.title ?? "Continue ScreenSmart task",
      updatedAt: now
    };

    return {
      mission,
      requiredAgents: mission.agentsUsed
    };
  }
}

function buildMissionTitle(session: ScreenSession) {
  return session.title ?? `${session.screenIntelligence?.screenType ?? "Screen"} mission`;
}

function buildMissionDescription(session: ScreenSession) {
  const intelligence = session.screenIntelligence;

  if (!intelligence) {
    return session.summary ?? "Continue the current ScreenSmart workflow.";
  }

  return `${intelligence.detectedTask}. ${intelligence.reasoningSummary}`;
}

function getRequiredAgents(session: ScreenSession) {
  const runs = session.agentRuns?.map((run) => run.agentName) ?? [];

  return unique(["OrchestratorAgent", "MissionPlannerAgent", ...runs]).slice(0, 12);
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
