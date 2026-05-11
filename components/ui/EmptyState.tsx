import { Text, View } from "react-native";

import { PrimaryButton } from "./PrimaryButton";

type EmptyStateProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="items-center rounded-[32px] border border-white/10 bg-white/5 p-6">
      <Text className="text-center text-2xl font-black text-white">{title}</Text>
      <Text className="mt-2 text-center text-base leading-7 text-slate-300">{message}</Text>
      {actionLabel && onAction ? (
        <View className="mt-5 w-full">
          <PrimaryButton label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
