import { ActivityIndicator, Text, View } from "react-native";

export function TypingIndicator() {
  return (
    <View className="self-start rounded-3xl border border-white/10 bg-white/10 px-4 py-3">
      <View className="flex-row items-center gap-3">
        <ActivityIndicator color="#2DD4BF" size="small" />
        <Text className="text-sm font-bold text-slate-300">ScreenSmart is thinking...</Text>
      </View>
    </View>
  );
}
