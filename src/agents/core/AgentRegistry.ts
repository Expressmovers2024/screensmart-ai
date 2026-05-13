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
import { SessionSummaryAgent } from "../screensmart/SessionSummaryAgent";
import { MissionPlannerAgent } from "../screensmart/MissionPlannerAgent";
import { NotesAgent } from "../screensmart/NotesAgent";
import { OCRAgent } from "../screensmart/OCRAgent";
import { SafetyAgent } from "../screensmart/SafetyAgent";
import { SummaryAgent } from "../screensmart/SummaryAgent";
import { TalkBackAgent } from "../screensmart/TalkBackAgent";
import { VisionAgent } from "../screensmart/VisionAgent";
import { VoiceAgent } from "../screensmart/VoiceAgent";

/**
 * AgentRegistry — single source of truth for all registered agents.
 *
 * OrchestratorAgent uses the registry for dependency injection rather
 * than instantiating agents directly. This enables:
 *   - Swapping implementations in tests
 *   - Adding agents without touching OrchestratorAgent
 *   - Future dynamic loading of remote/browser agents
 *
 * To add a new agent: instantiate it below and it is automatically
 * available via agentRegistry.get("your.agent.id").
 */
export class AgentRegistry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private agents = new Map<string, AgentLike<any, any>>();

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coreAgents: AgentLike<any, any>[] = [
      new OrchestratorAgent(),
      new OCRAgent(),
      new VisionAgent(),
      new SummaryAgent(),
      new ExplainAgent(),
      new TalkBackAgent(),
      new MissionPlannerAgent(),
      new NotesAgent(),
      new VoiceAgent(),
      new SessionSummaryAgent(),
      new SafetyAgent(),
      new ResearchAgent(),
      new WebSearchAgent(),
      new FactCheckAgent(),
      new BrowserAgent(),
      new WebAutomationAgent(),
      new CodingAgent(),
      new QAAgent()
    ];

    coreAgents.forEach((agent) => this.register(agent));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register(agent: AgentLike<any, any>): void {
    this.agents.set(agent.id, agent);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get<TAgent extends AgentLike<any, any>>(id: string): TAgent | undefined {
    return this.agents.get(id) as TAgent | undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getOrThrow<TAgent extends AgentLike<any, any>>(id: string): TAgent {
    const agent = this.get<TAgent>(id);
    if (!agent) {
      throw new Error(
        `AgentRegistry: agent "${id}" not found. ` +
          `Registered agents: ${Array.from(this.agents.keys()).join(", ")}`
      );
    }
    return agent;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  list(): AgentLike<any, any>[] {
    return Array.from(this.agents.values());
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listByDepartment(department: string): AgentLike<any, any>[] {
    return this.list().filter((a) => a.department === department);
  }
}

/** Singleton registry — use this throughout the app. */
export const agentRegistry = new AgentRegistry();
