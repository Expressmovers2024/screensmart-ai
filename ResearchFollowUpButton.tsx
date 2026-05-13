import { Text, View } from "react-native";

import { PrimaryButton } from "./PrimaryButton";

type EmptyStateProps = {
  title: string;
  message: string;
  /** Large emoji shown above the title */
  emoji?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Secondary ghost CTA */
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
};

export function EmptyState({
  title,
  message,
  emoji,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction
}: EmptyStateProps) {
  return (
    <View className="items-center rounded-[32px] border border-white/10 bg-white/5 p-8">
      {emoji && (
        <Text className="mb-4 text-5xl">{emoji}</Text>
      )}
      <Text className="text-center text-xl font-black text-white">{title}</Text>
      <Text className="mt-2 max-w-xs text-center text-sm leading-6 text-slate-400">
        {message}
      </Text>
      {actionLabel && onAction ? (
        <View className="mt-5 w-full gap-3">
          <PrimaryButton label={actionLabel} onPress={onAction} />
          {secondaryLabel && onSecondaryAction ? (
            <PrimaryButton label={secondaryLabel} onPress={onSecondaryAction} variant="ghost" />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
