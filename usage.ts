import type { UploadedScreenshot } from "@/services/ocr";
import type { ScreenSession } from "@/types/screenSession";
import { createId } from "@/utils/createId";

import { BaseAgent } from "./BaseAgent";
import type {
  AgentContext,
  AgentRun,
  ContinueTaskPlan,
  ScreenIntelligenceOutput,
  WorkflowCheckpoint
} from "./AgentTypes";
import { agentRegistry } from "./AgentRegistry";
import type { SessionSummaryAgent } from "../screensmart/SessionSummaryAgent";
import type { NotesAgent } from "../screensmart/NotesAgent";
import type { OCRAgent } from "../screensmart/OCRAgent";
import type { SafetyAgent } from "../screensmart/SafetyAgent";
import type { SummaryAgent } from "../screensmart/SummaryAgent";
import type { TalkBackAgent } from "../screensmart/TalkBackAgent";
import type { VisionAgent } from "../screensmart/VisionAgent";

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

/**
 * OrchestratorAgent
 *
 * Fix: agents are resolved from AgentRegistry rather than instantiated
 * directly. This enables:
 *   - Dependency injection for testing (register mock agents before run)
 *   - Zero-change agent swaps (replace implementation in registry)
 *   - Future dynamic agent loading (browser agents, remote agents)
 *
 * Constructor accepts an optional registry so tests can inject fakes:
 *   new OrchestratorAgent(testRegistry)
 */
export class OrchestratorAgent extends BaseAgent<
  ScreenshotFlowInput,
  ScreenshotAgentFlowOutput
> {
  constructor(private readonly registry = agentRegistry) {
    super({
      id: "core.orchestrator",
      name: "OrchestratorAgent",
      department: "core",
      role: "Coordinate the ScreenSmart agent swarm",
      description:
        "Runs the screenshot workflow from OCR through session summary. " +
        "Agents are resolved from AgentRegistry for loose coupling."
    });
  }

  // Convenience accessors — resolved lazily from registry
  private get ocrAgent() {
    return this.registry.getOrThrow<OCRAgent>("screensmart.ocr");
  }
  private get visionAgent() {
    return this.registry.getOrThrow<VisionAgent>("screensmart.vision");
  }
  private get summaryAgent() {
    return this.registry.getOrThrow<SummaryAgent>("screensmart.summary");
  }
  private get safetyAgent() {
    return this.registry.getOrThrow<SafetyAgent>("screensmart.safety");
  }
  private get talkBackAgent() {
    return this.registry.getOrThrow<TalkBackAgent>("screensmart.talkback");
  }
  private get notesAgent() {
    return this.registry.getOrThrow<NotesAgent>("screensmart.notes");
  }
  private get sessionSummaryAgent() {
    return this.registry.getOrThrow<SessionSummaryAgent>("screensmart.session-summary");
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

    // 1. OCR
    const rawOcr = (
      await this.ocrAgent.execute({ image: input.image, sessionId: input.sessionId }, context)
    ).output;
    const ocr = { ...rawOcr, sourceImage: stripImagePayload(rawOcr.sourceImage) };
    context.ocr = ocr;

    // 2. Safety check (parallel with vision is fine, but safety runs first
    //    so VisionAgent can potentially act on its warnings in the future)
    const safety = (
      await this.safetyAgent.execute({ text: ocr.extractedText }, context)
    ).output;

    // 3. Vision intelligence
    const intelligence = (
      await this.visionAgent.execute(
        { confidence: ocr.confidence, extractedText: ocr.extractedText, image: input.image },
        context
      )
    ).output;

    context.screenIntelligence = {
      ...intelligence,
      suggestedActions: mergeActions(intelligence.suggestedActions, safety.warnings)
    };

    // 4. Build session skeleton
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

    // 5. Summary
    const summary = (
      await this.summaryAgent.execute({ session, style: "short" }, context)
    ).output;
    context.summary = summary;
    session.summary = summary.content;
    session.workflowCheckpoints = [
      this.createCheckpoint(
        session,
        "Continue this task",
        "Review the AI plan and choose the next best action."
      )
    ];

    // 6. TalkBack (fire and use output for suggested actions)
    const talkBack = await this.talkBackAgent.execute({ session }, context);

    // 7. Notes
    await this.notesAgent.execute(
      {
        intelligence: context.screenIntelligence,
        sessionId: input.sessionId,
        summary: summary.content
      },
      context
    );

    // 8. Session summary (formerly MemoryAgent)
    await this.sessionSummaryAgent.execute(
      {
        intelligence: context.screenIntelligence,
        sessionId: input.sessionId,
        summary: summary.content,
        timeline: context.timeline ?? [],
        workflowCheckpoints: session.workflowCheckpoints
      },
      context
    );
    const sessionSummaryOutput = this.sessionSummaryAgent.output;

    // 9. Finalise session
    session.agentRuns = context.timeline ?? [];
    session.lastActiveAt = new Date().toISOString();
    session.tags = sessionSummaryOutput?.tags;
    session.title =
      sessionSummaryOutput?.sessionTitle ??
      this.createSessionTitle(context.screenIntelligence);
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

  private createSessionTitle(intelligence?: ScreenIntelligenceOutput): string {
    return intelligence
      ? `${intelligence.screenType}: ${intelligence.detectedTask}`.slice(0, 80)
      : "ScreenSmart session";
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

function mergeActions(actions: string[], warnings: string[]): string[] {
  if (warnings.length === 0) return actions;
  return Array.from(new Set(["Review safety notes", ...actions]));
}

function buildNextSteps(session: ScreenSession): string[] {
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
