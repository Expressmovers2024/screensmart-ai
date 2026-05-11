import { Text, View } from "react-native";

import { PrimaryButton, ScreenCard } from "@/components/ui";
import type { ScreenIntelligenceOutput } from "@/src/agents";

type ScreenIntelligenceCardsProps = {
  intelligence?: ScreenIntelligenceOutput;
  onActionPress?: (action: string) => void;
  onContinue?: () => void;
};

export function ScreenIntelligenceCards({ intelligence, onActionPress, onContinue }: ScreenIntelligenceCardsProps) {
  if (!intelligence) {
    return (
      <ScreenCard eyebrow="Screen intelligence" title="Waiting for agents">
        <Text className="text-base leading-7 text-slate-300">
          Upload a screenshot to generate screen type, detected task, key entities, and suggested actions.
        </Text>
      </ScreenCard>
    );
  }

  return (
    <View className="gap-5">
      <ScreenCard eyebrow="Screen type" title={intelligence.screenType}>
        <View className="self-start rounded-full bg-electric/20 px-4 py-2">
          <Text className="text-sm font-black uppercase tracking-[1.5px] text-electric">
            {Math.round(intelligence.confidence * 100)}% confidence
          </Text>
        </View>
        <Text className="mt-4 text-base leading-7 text-slate-300">{intelligence.summary}</Text>
      </ScreenCard>

      <ScreenCard eyebrow="Detected task" title={intelligence.detectedTask}>
        <Text className="text-base leading-7 text-slate-300">
          Key entities: {intelligence.keyEntities.length > 0 ? intelligence.keyEntities.join(", ") : "none detected"}
        </Text>
      </ScreenCard>

      <ScreenCard eyebrow="Suggested actions" title="Next best moves">
        <View className="gap-3">
          {intelligence.suggestedActions.map((action) => (
            <PrimaryButton
              key={action}
              label={action}
              onPress={() => onActionPress?.(action)}
              variant={action.toLowerCase().includes("summary") ? "primary" : "secondary"}
            />
          ))}
          <PrimaryButton label="Continue This Task" onPress={() => onContinue?.()} variant="ghost" />
        </View>
      </ScreenCard>
    </View>
  );
}
