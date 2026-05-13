import { Linking, Pressable, Text, View } from "react-native";

import type { ResearchCitation } from "@/types/research";

type ResearchCitationCardProps = {
  citation: ResearchCitation;
  index: number;
};

export function ResearchCitationCard({ citation, index }: ResearchCitationCardProps) {
  const handlePress = async () => {
    // Only open planned URLs — never auto-submit or auto-navigate
    try {
      const supported = await Linking.canOpenURL(citation.url);
      if (supported) await Linking.openURL(citation.url);
    } catch {
      // Silent — user can copy manually
    }
  };

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Open citation: ${citation.title}`}
      className="active:opacity-70"
      onPress={handlePress}
    >
      <View className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <View className="flex-row items-start gap-3">
          {/* Index badge */}
          <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-electric/20">
            <Text className="text-xs font-black text-electric">{index + 1}</Text>
          </View>

          <View className="flex-1 gap-1">
            {/* Planned badge */}
            {citation.isPlanned && (
              <View className="mb-1 self-start rounded-full bg-mint/10 px-2 py-0.5">
                <Text className="text-xs font-black uppercase tracking-[1px] text-mint">
                  Planned source
                </Text>
              </View>
            )}

            <Text className="text-sm font-bold leading-5 text-white" numberOfLines={2}>
              {citation.title}
            </Text>
            <Text className="text-xs leading-4 text-electric/80" numberOfLines={1}>
              {formatUrl(citation.url)}
            </Text>
            <Text className="mt-1 text-xs leading-5 text-slate-400" numberOfLines={3}>
              {citation.snippet}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function formatUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 40);
  }
}
