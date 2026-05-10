import { ActivityIndicator, Text, View } from "react-native";

type LoadingStateProps = {
  title: string;
  message: string;
};

export function LoadingState({ title, message }: LoadingStateProps) {
  return (
    <View
      accessibilityRole="progressbar"
      className="items-center rounded-[32px] border border-electric/30 bg-electric/10 p-6"
    >
      <ActivityIndicator color="#60A5FA" size="large" />
      <Text className="mt-4 text-center text-lg font-black text-white">{title}</Text>
      <Text className="mt-2 text-center text-base leading-6 text-slate-300">{message}</Text>
    </View>
  );
}
