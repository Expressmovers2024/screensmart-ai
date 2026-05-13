import { Text } from "react-native";

import type { MissionStatus } from "@/services/storage";

type MissionStatusBadgeProps = {
  status: MissionStatus;
};

const styles: Record<MissionStatus, string> = {
  active: "bg-mint/20 text-mint",
  blocked: "bg-red-500/20 text-red-100",
  completed: "bg-electric/20 text-electric",
  draft: "bg-white/10 text-slate-300",
  paused: "bg-amber-500/20 text-amber-100"
};

export function MissionStatusBadge({ status }: MissionStatusBadgeProps) {
  return (
    <Text className={`self-start rounded-full px-3 py-1 text-xs font-black uppercase tracking-[1px] ${styles[status]}`}>
      {status}
    </Text>
  );
}
