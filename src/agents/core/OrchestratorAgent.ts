import type { UploadedScreenshot } from "@/services/ocr";
import type { ScreenSession } from "@/types/screenSession";
import { createId } from "@/utils/createId";

import { BaseAgent } from "./BaseAgent";
import type { AgentContext, AgentRun, ContinueTaskPlan, ScreenIntelligenceOutput, WorkflowCheckpoint } from "./AgentTypes";
import { MemoryAgent } from "../screensmart/MemoryAgent";
import { NotesAgent } from "../screensmart/NotesAgent";
import { OCRAgent } from "../screensmart/OCRAgent";
import { SafetyAgent } from "../screensmart/SafetyAgent";
import { SummaryAgent } from "../screensmart/SummaryAgent";
import { TalkBackAgent } from "../screensmart/TalkBackAgent";
import { VisionAgent } from "../screensmart/VisionAgent";

type ScreenshotFlowInput = {
  image: UploadedScreenshot;
  sessionId: string;
  onProgress?: (message: string) => void;
};

export type ScreenshotAgentFlowOutput = {
  session: ScreenSession;
  screenIntelligence: ScreenIntelligenceOutput;
  agentRuns: AgentRun[];
  suggestedActions: string[];
};

export class OrchestratorAgent extends BaseAgent<ScreenshotFlowInput, ScreenshotAgentFlowOutput> {
  private ocrAgent = new OCRAgent();
  private visionAgent = new VisionAgent();
  private summaryAgent = new SummaryAgent();
  private safetyAgent = new SafetyAgent();
  private talkBackAgent = new TalkBackAgent();
  private notesAgent = new NotesAgent();
  private memoryAgent = new MemoryAgent();

  constructor() {
    super({
      id: "core.orchestrator",
      name: "OrchestratorAgent",
      department: "core",
      role: "Coordinate the ScreenSmart agent swarm",
      description: "Runs the first production-ready screenshot workflow from OCR through memory."
    });
  }

  run(input: ScreenshotFlowInput, context: AgentContext) {
    return this.runScreenshotFlow(input, context);
  }

  async runScreenshotFlow(
    input: ScreenshotFlowInput,
    existingContext?: Partial<AgentContext>
  ): Promise<ScreenshotAgentFlowOutput> {
    const context: AgentContext = {
      sessionId: input.sessionId,
      onProgress: input.onProgress,
      screenshot: input.image,
      timeline: existingContext?.timeline ?? []
    };

    context.onProgress?.("OrchestratorAgent routing screenshot through the agent swarm...");

    const rawOcr = (await this.ocrAgent.execute({ image: input.image, sessionId: input.sessionId }, context)).output;
    const ocr = {
      ...rawOcr,
      sourceImage: stripImagePayload(rawOcr.sourceImage)
    };
    context.ocr = ocr;

    const safety = (await this.safetyAgent.execute({ text: ocr.extractedText }, context)).output;
    const intelligence = (
      await this.visionAgent.execute(
        {
          confidence: ocr.confidence,
          extractedText: ocr.extractedText,
          image: input.image
        },
        context
      )
    ).output;
    context.screenIntelligence = {
      ...intelligence,
      suggestedActions: mergeActions(intelligence.suggestedActions, safety.warnings)
    };

    const session: ScreenSession = {
      id: input.sessionId,
      agentRuns: context.timeline ?? [],
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      ocr,
      screenIntelligence: context.screenIntelligence,
      screenshot: ocr.sourceImage,
      workflowCheckpoints: []
    };
    context.session = session;

    const summary = (await this.summaryAgent.execute({ session, style: "short" }, context)).output;
    context.summary = summary;
    session.summary = summary.content;
    session.workflowCheckpoints = [
      this.createCheckpoint(session, "Continue this task", "Review the AI plan and choose the next best action.")
    ];

    const talkBack = await this.talkBackAgent.execute({ session }, context);

    await this.notesAgent.execute(
      {
        intelligence: context.screenIntelligence,
        sessionId: input.sessionId,
        summary: summary.content
      },
      context
    );
    await this.memoryAgent.execute(
      {
        intelligence: context.screenIntelligence,
        sessionId: input.sessionId,
        summary: summary.content,
        timeline: context.timeline ?? [],
        workflowCheckpoints: session.workflowCheckpoints
      },
      context
    );
    const memoryOutput = this.memoryAgent.output;

    session.agentRuns = context.timeline ?? [];
    session.lastActiveAt = new Date().toISOString();
    session.tags = memoryOutput?.tags;
    session.title = memoryOutput?.sessionTitle ?? this.createSessionTitle(context.screenIntelligence);
    session.screenIntelligence = context.screenIntelligence;

    return {
      agentRuns: session.agentRuns,
      screenIntelligence: context.screenIntelligence,
      session,
      suggestedActions: [
        ...context.screenIntelligence.suggestedActions,
        talkBack.output.body ? "Continue TalkBack" : "Ask TalkBack"
      ]
    };
  }

  async continueTask(session: ScreenSession): Promise<ContinueTaskPlan> {
    const intelligence = session.screenIntelligence;
    const recommendedNextSteps = buildNextSteps(session);
    const checkpoint = this.createCheckpoint(
      session,
      "Continue this task",
      intelligence
        ? `Continue from ${intelligence.screenType}: ${intelligence.detectedTask}`
        : "Continue the current ScreenSmart workflow.",
      recommendedNextSteps
    );

    return {
      checkpoint,
      reasoningSummary:
        intelligence?.reasoningSummary ??
        "ScreenSmart reviewed the current session context and prepared practical next steps.",
      recommendedNextSteps
    };
  }

  private createCheckpoint(
    session: ScreenSession,
    title: string,
    description: string,
    nextActions = buildNextSteps(session)
  ): WorkflowCheckpoint {
    return {
      id: createId("workflow-checkpoint"),
      agentId: this.id,
      createdAt: new Date().toISOString(),
      description,
      nextActions,
      sessionId: session.id,
      status: "open",
      title
    };
  }

  private createSessionTitle(intelligence?: ScreenIntelligenceOutput) {
    return intelligence ? `${intelligence.screenType}: ${intelligence.detectedTask}`.slice(0, 80) : "ScreenSmart session";
  }
}

function stripImagePayload(image: UploadedScreenshot): UploadedScreenshot {
  return {
    fileName: image.fileName,
    height: image.height,
    mimeType: image.mimeType,
    uri: image.uri,
    width: image.width
  };
}

function mergeActions(actions: string[], warnings: string[]) {
  if (warnings.length === 0) {
    return actions;
  }

  return Array.from(new Set(["Review safety notes", ...actions]));
}

function buildNextSteps(session: ScreenSession) {
  const actions = session.screenIntelligence?.suggestedActions ?? [];
  const baseline = [
    "Read the AI summary",
    "Ask a TalkBack follow-up",
    "Turn this into notes",
    "Save to library",
    "Review risks before acting"
  ];

  return Array.from(new Set([...actions, ...baseline])).slice(0, 5);
}
