import { useState } from "react";
import { Pressable, Text, View } from "react-native";

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

const statusIcon: Record<string, string> = {
  blocked: "!",
  error: "x",
  idle: "-",
  running: "...",
  success: "✓"
};

export function AgentTimelinePanel({ runs = [] }: AgentTimelinePanelProps) {
  const [expandedRunIds, setExpandedRunIds] = useState<Record<string, boolean>>({});

  return (
    <ScreenCard eyebrow="AI operating system activity" title={`${runs.length} agent${runs.length === 1 ? "" : "s"} ran`}>
      <View className="gap-3">
        {runs.length === 0 ? (
          <Text className="text-base leading-7 text-slate-300">Agent activity will appear after a screenshot is processed.</Text>
        ) : null}
        {runs.map((run) => {
          const isExpanded = expandedRunIds[run.id] ?? false;

          return (
          <Pressable
            accessibilityRole="button"
            className="rounded-3xl border border-white/10 bg-white/5 p-4 active:opacity-80"
            key={run.id}
            onPress={() => setExpandedRunIds((state) => ({ ...state, [run.id]: !isExpanded }))}
          >
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-lg font-black text-white">
                  {statusIcon[run.status]} {run.agentName}
                </Text>
                <Text className="mt-1 text-sm font-bold text-slate-400">
                  {run.completedAt ? `Completed ${new Date(run.completedAt).toLocaleTimeString()}` : "Running"}
                  {typeof run.durationMs === "number" ? ` • ${run.durationMs}ms` : ""}
                </Text>
              </View>
              <Text className={`rounded-full px-3 py-1 text-xs font-black uppercase ${statusStyles[run.status]}`}>
                {run.status}
              </Text>
            </View>
            <Text className="mt-3 text-base leading-6 text-slate-300" numberOfLines={3}>
              {run.outputSummary ?? run.error ?? getShortResult(run.output)}
            </Text>
            {isExpanded ? (
              <View className="mt-4 gap-3 rounded-3xl border border-white/10 bg-ink/60 p-4">
                <DetailLine label="Input" value={run.inputSummary ?? summarizeUnknown(run.input)} />
                <DetailLine label="Output" value={run.outputSummary ?? summarizeUnknown(run.output)} />
                <DetailLine
                  label="Confidence"
                  value={typeof run.confidence === "number" ? `${Math.round(run.confidence * 100)}%` : "Not reported"}
                />
                <DetailLine label="Duration" value={typeof run.durationMs === "number" ? `${run.durationMs}ms` : "Pending"} />
                {run.error ? <DetailLine label="Error" value={run.error} tone="error" /> : null}
              </View>
            ) : null}
            <Text className="mt-3 text-xs font-black uppercase tracking-[1.5px] text-slate-500">
              Tap to {isExpanded ? "collapse" : "inspect"} run details
            </Text>
          </Pressable>
          );
        })}
      </View>
    </ScreenCard>
  );
}

function DetailLine({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "error" }) {
  return (
    <View>
      <Text className="text-xs font-black uppercase tracking-[1.5px] text-slate-500">{label}</Text>
      <Text className={`mt-1 text-sm leading-6 ${tone === "error" ? "text-red-100" : "text-slate-300"}`}>{value}</Text>
    </View>
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

function summarizeUnknown(value: unknown) {
  const summary = getShortResult(value);
  return summary.length > 220 ? `${summary.slice(0, 220)}...` : summary;
}
