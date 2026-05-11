import type { ReactNode } from "react";
import { Text, View } from "react-native";

type ScreenCardProps = {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
};

export function ScreenCard({ title, eyebrow, children }: ScreenCardProps) {
  return (
    <View className="rounded-[32px] border border-white/10 bg-white/10 p-6">
      {eyebrow ? <Text className="mb-2 text-xs font-black uppercase tracking-[2px] text-mint">{eyebrow}</Text> : null}
      {title ? <Text className="mb-4 text-xl font-black text-white">{title}</Text> : null}
      <View className="gap-4">{children}</View>
    </View>
  );
}
