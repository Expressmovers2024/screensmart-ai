import { Pressable, Text } from "react-native";

import type { RecentActivity } from "@/services/storage";

type RecentActivityCardProps = {
  activity: RecentActivity;
  onPress?: () => void;
};

export function RecentActivityCard({ activity, onPress }: RecentActivityCardProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      className="rounded-[28px] border border-white/10 bg-white/10 p-5 active:opacity-80"
      disabled={!onPress}
      onPress={onPress}
    >
      <Text className="text-xs font-black uppercase tracking-[1.5px] text-electric">
        {activity.type.replace("_", " ")} • {new Date(activity.createdAt).toLocaleString()}
      </Text>
      <Text className="mt-2 text-lg font-black text-white">{activity.title}</Text>
      <Text className="mt-2 text-base leading-6 text-slate-300" numberOfLines={3}>
        {activity.subtitle || "No details available."}
      </Text>
      {onPress ? <Text className="mt-4 text-sm font-black text-electric">Open</Text> : null}
    </Pressable>
  );
}
