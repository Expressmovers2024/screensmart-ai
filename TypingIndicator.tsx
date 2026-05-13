import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import type { ResearchResult } from "@/types/research";

import { ResearchCitationCard } from "./ResearchCitationCard";
import { RelatedTopicsCard } from "./RelatedTopicsCard";
import { ResearchFollowUpButton } from "./ResearchFollowUpButton";

type ResearchPanelProps = {
  result: ResearchResult | null;
  isLoading?: boolean;
  error?: string | null;
  onFollowUp?: (question: string) => void;
  onTopicPress?: (topic: string) => void;
};

export function ResearchPanel({
  result,
  isLoading = false,
  error = null,
  onFollowUp,
  onTopicPress
}: ResearchPanelProps) {
  if (isLoading) {
    return (
      <View className="rounded-[32px] border border-white/10 bg-white/10 p-6">
        <Text className="mb-2 text-xs font-black uppercase tracking-[2px] text-electric">
          Research
        </Text>
        <View className="items-center gap-3 py-6">
          <ActivityIndicator color="#6EE7B7" />
          <Text className="text-sm font-bold text-slate-400">
            ResearchAgent analyzing screen...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="rounded-[32px] border border-white/10 bg-white/10 p-6">
        <Text className="mb-2 text-xs font-black uppercase tracking-[2px] text-electric">
          Research
        </Text>
        <View className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
          <Text className="text-sm font-bold text-red-400">Research unavailable</Text>
          <Text className="mt-1 text-xs text-slate-400">{error}</Text>
        </View>
      </View>
    );
  }

  if (!result) return null;

  const confidencePct = Math.round(result.confidence * 100);
  const isPlanning = result.mode === "planning";

  return (
    <View className="rounded-[32px] border border-white/10 bg-white/10 p-6">
      {/* Header */}
      <View className="mb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-xs font-black uppercase tracking-[2px] text-electric">
            Research
          </Text>
          <Text className="mt-1 text-xl font-black text-white" numberOfLines={2}>
            {result.query}
          </Text>
        </View>
        <View className="items-end gap-1">
          <ConfidenceBadge pct={confidencePct} />
          {isPlanning && (
            <View className="rounded-full bg-mint/10 px-2 py-0.5">
              <Text className="text-xs font-black uppercase tracking-[1px] text-mint">
                Planning mode
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Summary */}
      <View className="gap-4">
        <View className="rounded-2xl bg-white/5 p-4">
          <Text className="mb-1 text-xs font-black uppercase tracking-[1.5px] text-slate-400">
            Research summary
          </Text>
          <Text className="text-sm leading-6 text-slate-200">{result.summary}</Text>
        </View>

        {/* Search queries */}
        {result.searchQueries.length > 0 && (
          <View>
            <Text className="mb-2 text-xs font-black uppercase tracking-[1.5px] text-slate-400">
              What to search
            </Text>
            <View className="gap-2">
              {result.searchQueries.map((q, i) => (
                <View
                  key={i}
                  className="flex-row items-center gap-2 rounded-xl bg-white/5 px-4 py-3"
                >
                  <Text className="text-xs font-black text-electric">{i + 1}</Text>
                  <Text className="flex-1 text-sm font-bold text-white">{q}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Citations */}
        {result.citations.length > 0 && (
          <View>
            <Text className="mb-2 text-xs font-black uppercase tracking-[1.5px] text-slate-400">
              {isPlanning ? "Sources to check" : "Citations"}
            </Text>
            <View className="gap-3">
              {result.citations.map((citation, i) => (
                <ResearchCitationCard key={i} citation={citation} index={i} />
              ))}
            </View>
          </View>
        )}

        {/* Evidence gaps */}
        {result.evidenceGaps.length > 0 && (
          <View className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
            <Text className="mb-2 text-xs font-black uppercase tracking-[1.5px] text-yellow-400">
              Evidence gaps
            </Text>
            <View className="gap-1.5">
              {result.evidenceGaps.map((gap, i) => (
                <Text key={i} className="text-xs leading-5 text-yellow-200/80">
                  • {gap}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Related topics */}
        {result.relatedTopics.length > 0 && (
          <RelatedTopicsCard
            topics={result.relatedTopics}
            onTopicPress={onTopicPress}
          />
        )}

        {/* Follow-up buttons */}
        {result.suggestedFollowUps.length > 0 && (
          <View>
            <Text className="mb-2 text-xs font-black uppercase tracking-[1.5px] text-slate-400">
              Research follow-ups
            </Text>
            <View className="gap-2">
              {result.suggestedFollowUps.map((q, i) => (
                <ResearchFollowUpButton
                  key={i}
                  question={q}
                  onPress={onFollowUp ?? (() => {})}
                />
              ))}
            </View>
          </View>
        )}

        {/* Planning mode notice */}
        {isPlanning && (
          <View className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <Text className="text-xs leading-5 text-slate-500">
              ScreenSmart is in research planning mode. No external requests were made. 
              Use the search queries and source suggestions above to research manually.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ConfidenceBadge({ pct }: { pct: number }) {
  const color =
    pct >= 70 ? "text-mint bg-mint/10" : pct >= 45 ? "text-electric bg-electric/10" : "text-slate-400 bg-white/5";
  return (
    <View className={`rounded-full px-2 py-0.5 ${color.split(" ")[1]}`}>
      <Text className={`text-xs font-black ${color.split(" ")[0]}`}>{pct}% conf.</Text>
    </View>
  );
}
