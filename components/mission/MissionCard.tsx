import { Text, View } from "react-native";

import { PrimaryButton, ScreenCard } from "@/components/ui";
import type { Mission } from "@/services/storage";

import { MissionStatusBadge } from "./MissionStatusBadge";

type MissionCardProps = {
  mission: Mission;
  onContinue?: () => void;
};

export function MissionCard({ mission, onContinue }: MissionCardProps) {
  return (
    <ScreenCard eyebrow="Mission" title={mission.title}>
      <MissionStatusBadge status={mission.status} />
      <Text className="mt-4 text-base leading-7 text-slate-300">{mission.description}</Text>
      <View className="mt-4 flex-row flex-wrap gap-2">
        <Text className="rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[1px] text-slate-300">
          {mission.sessionIds.length} session{mission.sessionIds.length === 1 ? "" : "s"}
        </Text>
        <Text className="rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[1px] text-slate-300">
          {mission.checkpointIds.length} checkpoint{mission.checkpointIds.length === 1 ? "" : "s"}
        </Text>
      </View>
      <Text className="mt-4 text-sm font-bold leading-6 text-slate-400">
        Agents: {mission.agentsUsed.slice(0, 5).join(", ") || "MissionPlannerAgent"}
      </Text>
      <View className="mt-5 gap-3">
        {mission.nextActions.slice(0, 3).map((action) => (
          <Text className="rounded-2xl bg-electric/10 px-4 py-3 text-base font-bold text-electric" key={action}>
            {action}
          </Text>
        ))}
      </View>
      <View className="mt-5">
        <PrimaryButton label="Continue mission" onPress={() => onContinue?.()} />
      </View>
    </ScreenCard>
  );
}
