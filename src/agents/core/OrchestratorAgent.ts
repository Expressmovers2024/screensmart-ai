import type { UploadedScreenshot } from "@/services/ocr";
import type { ScreenSession } from "@/types/screenSession";

import { BaseAgent } from "./BaseAgent";
import type { AgentContext, AgentRun, ScreenIntelligenceOutput } from "./AgentTypes";
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

    const ocr = (await this.ocrAgent.execute({ image: input.image, sessionId: input.sessionId }, context)).output;
    context.ocr = ocr;

    const safety = (await this.safetyAgent.execute({ text: ocr.extractedText }, context)).output;
    const intelligence = (
      await this.visionAgent.execute(
        {
          confidence: ocr.confidence,
          extractedText: ocr.extractedText
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
      ocr,
      screenIntelligence: context.screenIntelligence,
      screenshot: ocr.sourceImage
    };
    context.session = session;

    const summary = (await this.summaryAgent.execute({ session, style: "short" }, context)).output;
    context.summary = summary;
    session.summary = summary.content;

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
        timeline: context.timeline ?? []
      },
      context
    );

    session.agentRuns = context.timeline ?? [];
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
}

function mergeActions(actions: string[], warnings: string[]) {
  if (warnings.length === 0) {
    return actions;
  }

  return Array.from(new Set(["Review safety notes", ...actions]));
}
