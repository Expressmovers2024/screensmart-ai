import { Text, View } from "react-native";

import { ScreenCard } from "@/components/ui";
import type { Mission } from "@/services/storage";
import type { AgentRun, WorkflowCheckpoint } from "@/src/agents";

type AgentActivityFeedProps = {
  agentRuns: AgentRun[];
  checkpoints: WorkflowCheckpoint[];
  missions: Mission[];
};

type FeedItem = {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  status: string;
};

export function AgentActivityFeed({ agentRuns, checkpoints, missions }: AgentActivityFeedProps) {
  const items: FeedItem[] = [
    ...agentRuns.map((run) => ({
      id: `run-${run.id}`,
      status: run.status,
      subtitle: run.outputSummary ?? run.error ?? "Agent run completed",
      timestamp: run.completedAt ?? run.startedAt,
      title: run.agentName
    })),
    ...checkpoints.map((checkpoint) => ({
      id: `checkpoint-${checkpoint.id}`,
      status: checkpoint.status,
      subtitle: checkpoint.description,
      timestamp: checkpoint.createdAt,
      title: checkpoint.title
    })),
    ...missions.map((mission) => ({
      id: `mission-${mission.id}`,
      status: mission.status,
      subtitle: mission.description,
      timestamp: mission.updatedAt,
      title: mission.title
    }))
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 12);

  return (
    <ScreenCard eyebrow="Agent activity feed" title="Latest OS activity">
      <View className="gap-3">
        {items.length === 0 ? (
          <Text className="text-base leading-7 text-slate-300">Agent runs, checkpoints, and missions will appear here.</Text>
        ) : null}
        {items.map((item) => (
          <View className="rounded-3xl border border-white/10 bg-white/5 p-4" key={item.id}>
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-lg font-black text-white">{item.title}</Text>
                <Text className="mt-1 text-sm font-bold text-slate-400">{new Date(item.timestamp).toLocaleString()}</Text>
              </View>
              <Text className="rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[1px] text-slate-300">
                {item.status}
              </Text>
            </View>
            <Text className="mt-3 text-base leading-6 text-slate-300" numberOfLines={3}>
              {item.subtitle}
            </Text>
          </View>
        ))}
      </View>
    </ScreenCard>
  );
}
