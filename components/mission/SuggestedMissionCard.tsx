import { Text } from "react-native";

import { PrimaryButton, ScreenCard } from "@/components/ui";
import type { ScreenSession } from "@/types/screenSession";

type SuggestedMissionCardProps = {
  session: ScreenSession;
  onCreateMission?: () => void;
};

export function SuggestedMissionCard({ session, onCreateMission }: SuggestedMissionCardProps) {
  const intelligence = session.screenIntelligence;

  return (
    <ScreenCard eyebrow="Suggested mission" title={session.title ?? "Create a mission from this screen"}>
      <Text className="text-base leading-7 text-slate-300">
        {intelligence
          ? `${intelligence.detectedTask}. Continue with ${intelligence.suggestedActions.slice(0, 2).join(" or ")}.`
          : "Turn this saved screen into a reusable mission with checkpoints and agent next steps."}
      </Text>
      <Text className="mt-3 text-sm font-bold text-slate-400">
        Last active: {new Date(session.lastActiveAt ?? session.savedAt ?? session.createdAt).toLocaleString()}
      </Text>
      <PrimaryButton label="Create mission" onPress={() => onCreateMission?.()} variant="secondary" />
    </ScreenCard>
  );
}
