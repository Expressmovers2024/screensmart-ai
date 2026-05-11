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
        <View className="flex-row flex-wrap gap-2">
          <View className="rounded-full bg-electric/20 px-4 py-2">
            <Text className="text-sm font-black uppercase tracking-[1.5px] text-electric">
              {Math.round(intelligence.confidence * 100)}% confidence
            </Text>
          </View>
          <View className="rounded-full bg-white/10 px-4 py-2">
            <Text className="text-sm font-black uppercase tracking-[1.5px] text-slate-300">{intelligence.appOrWebsite}</Text>
          </View>
          {intelligence.fallbackUsed ? (
            <View className="rounded-full bg-amber-500/20 px-4 py-2">
              <Text className="text-sm font-black uppercase tracking-[1.5px] text-amber-100">OCR-only fallback</Text>
            </View>
          ) : null}
        </View>
        <Text className="mt-4 text-base leading-7 text-slate-300">{intelligence.visualSummary}</Text>
        <Text className="mt-3 text-sm font-bold leading-6 text-slate-400">{intelligence.layoutDescription}</Text>
      </ScreenCard>

      <ScreenCard eyebrow="Detected task" title={intelligence.detectedTask}>
        <Text className="text-base leading-7 text-slate-300">
          Key entities: {intelligence.keyEntities.length > 0 ? intelligence.keyEntities.join(", ") : "none detected"}
        </Text>
        <Text className="mt-3 text-base leading-7 text-slate-300">Intent guess: {intelligence.userIntentGuess}</Text>
        {intelligence.importantNumbers.length > 0 ? (
          <Text className="mt-3 text-base leading-7 text-slate-300">
            Important numbers: {intelligence.importantNumbers.join(", ")}
          </Text>
        ) : null}
        {intelligence.importantVisualElements.length > 0 ? (
          <Text className="mt-3 text-base leading-7 text-slate-300">
            Visual elements: {intelligence.importantVisualElements.join(", ")}
          </Text>
        ) : null}
      </ScreenCard>

      <ScreenCard eyebrow="Why this matters" title="Reasoning summary">
        <Text className="text-base leading-7 text-slate-300">{intelligence.reasoningSummary}</Text>
        {intelligence.visibleProblems.length > 0 ? (
          <View className="mt-4 gap-2">
            {intelligence.visibleProblems.map((problem) => (
              <Text className="rounded-2xl bg-amber-500/10 px-4 py-3 text-base leading-6 text-amber-100" key={problem}>
                {problem}
              </Text>
            ))}
          </View>
        ) : (
          <Text className="mt-3 text-base leading-7 text-mint">No obvious visible problems detected.</Text>
        )}
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
