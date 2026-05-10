import type { CapabilityKey } from "@/constants/capabilities";
import type { ReusableSessionContext } from "@/types/sessionContext";

export type AgentId = "screen-companion";

export type AgentDefinition = {
  id: AgentId;
  label: string;
  description: string;
  requiredCapabilities: CapabilityKey[];
};

export type AgentRunRequest<Input = unknown> = {
  context: ReusableSessionContext;
  input: Input;
};

export type AgentRunResult<Output = unknown> = {
  agentId: AgentId;
  output: Output;
  createdAt: string;
};
