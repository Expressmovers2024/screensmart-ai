import { Pressable, Text, View } from "react-native";

type RelatedTopicsCardProps = {
  topics: string[];
  onTopicPress?: (topic: string) => void;
};

export function RelatedTopicsCard({ topics, onTopicPress }: RelatedTopicsCardProps) {
  if (topics.length === 0) return null;

  return (
    <View className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <Text className="mb-3 text-xs font-black uppercase tracking-[1.5px] text-mint">
        Related topics
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {topics.map((topic) => (
          <Pressable
            key={topic}
            accessibilityRole="button"
            accessibilityLabel={`Explore topic: ${topic}`}
            className="active:opacity-70"
            onPress={() => onTopicPress?.(topic)}
          >
            <View className="rounded-full border border-mint/30 bg-mint/10 px-3 py-1.5">
              <Text className="text-xs font-bold text-mint">{topic}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
