import type { Href } from "expo-router";
import { Link } from "expo-router";
import { Text, View } from "react-native";

type FoundationScreenProps = {
  title: string;
  description: string;
  nextHref?: Href;
  nextLabel?: string;
};

export function FoundationScreen({ title, description, nextHref, nextLabel }: FoundationScreenProps) {
  return (
    <View className="flex-1 bg-ink px-6 py-14">
      <View className="mb-8">
        <Text className="text-xs font-black uppercase tracking-[2px] text-electric">ScreenSmart AI</Text>
        <Text className="mt-3 text-4xl font-black leading-tight text-white">{title}</Text>
        <Text className="mt-4 text-base leading-7 text-slate-300">{description}</Text>
      </View>

      <View className="rounded-[32px] border border-white/10 bg-white/10 p-6">
        <Text className="text-lg font-extrabold text-white">Foundation route</Text>
        <Text className="mt-2 text-base leading-7 text-slate-300">
          This screen is intentionally minimal while the production architecture is initialized.
        </Text>
      </View>

      {nextHref && nextLabel ? (
        <Link
          accessibilityRole="button"
          className="mt-6 min-h-14 rounded-2xl bg-electric px-6 py-4 text-center text-base font-black text-ink"
          href={nextHref}
        >
          {nextLabel}
        </Link>
      ) : null}
    </View>
  );
}
