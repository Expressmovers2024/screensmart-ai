import { Text, View } from "react-native";

import type { PlanTier } from "@/types/plans";

type PlanBadgeProps = {
  tier: PlanTier;
  size?: "sm" | "md";
};

const TIER_CONFIG: Record<
  PlanTier,
  { label: string; bg: string; text: string; emoji: string }
> = {
  free_local: {
    label: "Free Local",
    bg: "bg-mint/10",
    text: "text-mint",
    emoji: "🏠"
  },
  pro_cloud: {
    label: "Pro Cloud",
    bg: "bg-electric/10",
    text: "text-electric",
    emoji: "⚡"
  },
  team: {
    label: "Team",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    emoji: "👥"
  },
  enterprise: {
    label: "Enterprise",
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    emoji: "🏢"
  }
};

export function PlanBadge({ tier, size = "sm" }: PlanBadgeProps) {
  const config = TIER_CONFIG[tier];
  const textSize = size === "md" ? "text-sm" : "text-xs";
  const padding = size === "md" ? "px-3 py-1.5" : "px-2 py-1";

  return (
    <View className={`flex-row items-center gap-1 self-start rounded-full ${config.bg} ${padding}`}>
      <Text className={textSize}>{config.emoji}</Text>
      <Text className={`font-black uppercase tracking-[1px] ${textSize} ${config.text}`}>
        {config.label}
      </Text>
    </View>
  );
}
