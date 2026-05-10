import { Text, View } from "react-native";

import type { RecentActivity } from "@/services/storage";

type RecentActivityCardProps = {
  activity: RecentActivity;
};

export function RecentActivityCard({ activity }: RecentActivityCardProps) {
  return (
    <View className="rounded-[28px] border border-white/10 bg-white/10 p-5">
      <Text className="text-xs font-black uppercase tracking-[1.5px] text-electric">
        {activity.type.replace("_", " ")} • {new Date(activity.createdAt).toLocaleString()}
      </Text>
      <Text className="mt-2 text-lg font-black text-white">{activity.title}</Text>
      <Text className="mt-2 text-base leading-6 text-slate-300" numberOfLines={3}>
        {activity.subtitle || "No details available."}
      </Text>
    </View>
  );
}
