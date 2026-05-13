import { ActivityIndicator, Text, View } from "react-native";

type LoadingStateProps = {
  title: string;
  message: string;
  progress?: number;
};

export function LoadingState({ title, message, progress }: LoadingStateProps) {
  const normalizedProgress = typeof progress === "number" ? Math.max(0, Math.min(1, progress)) : undefined;

  return (
    <View
      accessibilityRole="progressbar"
      className="items-center rounded-[32px] border border-electric/30 bg-electric/10 p-6"
    >
      <ActivityIndicator color="#60A5FA" size="large" />
      <Text className="mt-4 text-center text-lg font-black text-white">{title}</Text>
      <Text className="mt-2 text-center text-base leading-6 text-slate-300">{message}</Text>
      {typeof normalizedProgress === "number" ? (
        <View className="mt-5 w-full">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-xs font-black uppercase tracking-[1.5px] text-slate-400">Progress</Text>
            <Text className="text-xs font-black text-electric">{Math.round(normalizedProgress * 100)}%</Text>
          </View>
          <View className="h-3 overflow-hidden rounded-full bg-white/10">
            <View className="h-3 rounded-full bg-electric" style={{ width: `${normalizedProgress * 100}%` }} />
          </View>
        </View>
      ) : null}
    </View>
  );
}
