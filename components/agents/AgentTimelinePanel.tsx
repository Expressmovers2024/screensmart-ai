import { Text, View } from "react-native";

import { ScreenCard } from "@/components/ui";
import type { AgentRun } from "@/src/agents";

type AgentTimelinePanelProps = {
  runs?: AgentRun[];
};

const statusStyles: Record<string, string> = {
  blocked: "bg-amber-500/20 text-amber-100",
  error: "bg-red-500/20 text-red-100",
  idle: "bg-white/10 text-slate-300",
  running: "bg-electric/20 text-electric",
  success: "bg-mint/20 text-mint"
};

export function AgentTimelinePanel({ runs = [] }: AgentTimelinePanelProps) {
  return (
    <ScreenCard eyebrow="Agent timeline" title={`${runs.length} agent${runs.length === 1 ? "" : "s"} ran`}>
      <View className="gap-3">
        {runs.length === 0 ? (
          <Text className="text-base leading-7 text-slate-300">Agent activity will appear after a screenshot is processed.</Text>
        ) : null}
        {runs.map((run) => (
          <View className="rounded-3xl border border-white/10 bg-white/5 p-4" key={run.id}>
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-lg font-black text-white">{run.agentName}</Text>
                <Text className="mt-1 text-sm font-bold text-slate-400">
                  {run.completedAt ? `Completed ${new Date(run.completedAt).toLocaleTimeString()}` : "Running"}
                </Text>
              </View>
              <Text className={`rounded-full px-3 py-1 text-xs font-black uppercase ${statusStyles[run.status]}`}>
                {run.status}
              </Text>
            </View>
            <Text className="mt-3 text-base leading-6 text-slate-300" numberOfLines={3}>
              {run.error ?? getShortResult(run.output)}
            </Text>
          </View>
        ))}
      </View>
    </ScreenCard>
  );
}

function getShortResult(output: unknown) {
  if (!output) {
    return "No result payload.";
  }

  if (typeof output === "string") {
    return output;
  }

  if (typeof output === "object") {
    const record = output as Record<string, unknown>;
    const summary = record.summary ?? record.content ?? record.message ?? record.title ?? record.detectedTask;

    if (typeof summary === "string") {
      return summary;
    }
  }

  return "Agent completed successfully.";
}
