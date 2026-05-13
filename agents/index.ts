/**
 * @deprecated
 * The root /agents directory is DEPRECATED.
 * Import from @/src/agents instead.
 *
 * This file exists only to prevent build errors during migration.
 * Remove this directory once all callers have been updated.
 */
export { agentRegistry } from "@/src/agents";
export type { AgentRun, AgentStatus } from "@/src/agents";
