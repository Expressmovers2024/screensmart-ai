import type { AgentLike } from "./AgentTypes";
import { OrchestratorAgent } from "./OrchestratorAgent";
import { BrowserAgent } from "../browser/BrowserAgent";
import { WebAutomationAgent } from "../browser/WebAutomationAgent";
import { CodingAgent } from "../engineering/CodingAgent";
import { QAAgent } from "../engineering/QAAgent";
import { FactCheckAgent } from "../research/FactCheckAgent";
import { ResearchAgent } from "../research/ResearchAgent";
import { WebSearchAgent } from "../research/WebSearchAgent";
import { ExplainAgent } from "../screensmart/ExplainAgent";
import { MemoryAgent } from "../screensmart/MemoryAgent";
import { MissionPlannerAgent } from "../screensmart/MissionPlannerAgent";
import { NotesAgent } from "../screensmart/NotesAgent";
import { OCRAgent } from "../screensmart/OCRAgent";
import { SafetyAgent } from "../screensmart/SafetyAgent";
import { SummaryAgent } from "../screensmart/SummaryAgent";
import { TalkBackAgent } from "../screensmart/TalkBackAgent";
import { VisionAgent } from "../screensmart/VisionAgent";
import { VoiceAgent } from "../screensmart/VoiceAgent";

export class AgentRegistry {
  private agents = new Map<string, AgentLike<any, any>>();

  constructor() {
    [
      new OrchestratorAgent(),
      new OCRAgent(),
      new VisionAgent(),
      new SummaryAgent(),
      new ExplainAgent(),
      new TalkBackAgent(),
      new MissionPlannerAgent(),
      new NotesAgent(),
      new VoiceAgent(),
      new MemoryAgent(),
      new SafetyAgent(),
      new ResearchAgent(),
      new WebSearchAgent(),
      new FactCheckAgent(),
      new BrowserAgent(),
      new WebAutomationAgent(),
      new CodingAgent(),
      new QAAgent()
    ].forEach((agent) => this.register(agent));
  }

  register(agent: AgentLike<any, any>) {
    this.agents.set(agent.id, agent);
  }

  get<TAgent extends AgentLike<any, any>>(id: string) {
    return this.agents.get(id) as TAgent | undefined;
  }

  list() {
    return Array.from(this.agents.values());
  }
}

export const agentRegistry = new AgentRegistry();
