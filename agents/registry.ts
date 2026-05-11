import type { AgentDefinition } from "./types";

export const agentRegistry: AgentDefinition[] = [
  {
    id: "screen-companion",
    label: "Screen Companion",
    description: "MVP agent boundary for OCR-grounded summarization, explanation, audio, and TalkBack interactions.",
    requiredCapabilities: ["aiDiscussion", "ocrExtraction", "screenshotUpload"]
  }
];

export function getAgentDefinition(agentId: AgentDefinition["id"]) {
  return agentRegistry.find((agent) => agent.id === agentId);
}
