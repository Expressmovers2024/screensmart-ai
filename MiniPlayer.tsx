import { Text, View } from "react-native";

import { PrimaryButton } from "./PrimaryButton";

type RetryStateProps = {
  title: string;
  message: string;
  onRetry: () => void;
};

export function RetryState({ title, message, onRetry }: RetryStateProps) {
  return (
    <View className="rounded-[32px] border border-red-400/30 bg-red-500/10 p-6">
      <Text className="text-xl font-black text-red-100">{title}</Text>
      <Text className="mt-2 text-base leading-7 text-red-100">{message}</Text>
      <View className="mt-5">
        <PrimaryButton label="Retry" onPress={onRetry} />
      </View>
    </View>
  );
}
