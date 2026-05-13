import { Pressable, Text, View } from "react-native";

import type { UpgradeContext } from "@/types/plans";
import { PLAN_FEATURE_META } from "@/types/plans";

import { PlanBadge } from "./PlanBadge";

type UpgradeCardProps = {
  context: UpgradeContext;
  /**
   * Called when the user taps "Upgrade later" or any upgrade CTA.
   * For now this is a placeholder — real navigation happens when
   * the billing screen is built.
   */
  onUpgrade?: () => void;
  onDismiss?: () => void;
};

export function UpgradeCard({ context, onUpgrade, onDismiss }: UpgradeCardProps) {
  const meta = PLAN_FEATURE_META[context.feature];
  const plan = context.suggestedPlan;

  return (
    <View className="rounded-[32px] border border-electric/20 bg-electric/5 p-6">
      {/* Feature icon + headline */}
      <View className="mb-4 flex-row items-start gap-4">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-electric/10">
          <Text className="text-2xl">{meta.emoji}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs font-black uppercase tracking-[2px] text-electric">
            {plan.name} feature
          </Text>
          <Text className="mt-1 text-lg font-black leading-tight text-white">
            {context.headline}
          </Text>
        </View>
      </View>

      {/* Benefit copy */}
      <Text className="mb-4 text-sm leading-6 text-slate-300">{context.benefit}</Text>

      {/* What plan includes */}
      <View className="mb-4 rounded-2xl bg-white/5 p-4">
        <Text className="mb-2 text-xs font-black uppercase tracking-[1.5px] text-slate-400">
          Included in {plan.name}
        </Text>
        <View className="gap-1.5">
          {plan.features.slice(0, 4).map((f) => {
            const fm = PLAN_FEATURE_META[f];
            return (
              <View key={f} className="flex-row items-center gap-2">
                <Text className="text-base">{fm.emoji}</Text>
                <Text className="text-sm text-slate-300">{fm.label}</Text>
              </View>
            );
          })}
          {plan.features.length > 4 && (
            <Text className="text-xs text-slate-500">
              + {plan.features.length - 4} more features
            </Text>
          )}
        </View>
      </View>

      {/* Price */}
      <View className="mb-4 flex-row items-center justify-between">
        <View>
          {plan.priceMonthlyUsd !== undefined ? (
            <View className="flex-row items-baseline gap-1">
              <Text className="text-2xl font-black text-white">
                ${plan.priceMonthlyUsd}
              </Text>
              <Text className="text-sm text-slate-400">/month</Text>
            </View>
          ) : (
            <Text className="text-base font-black text-slate-400">Custom pricing</Text>
          )}
        </View>
        <PlanBadge tier={plan.tier} size="md" />
      </View>

      {/* CTAs */}
      <View className="gap-3">
        {plan.available ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={plan.upgradeLabel}
            className="min-h-14 items-center justify-center rounded-2xl bg-electric px-6 py-4 active:opacity-80"
            onPress={onUpgrade}
          >
            <Text className="text-base font-black text-ink">{plan.upgradeLabel}</Text>
          </Pressable>
        ) : (
          <View className="min-h-14 items-center justify-center rounded-2xl border border-electric/30 bg-electric/10 px-6 py-4">
            <Text className="text-base font-black text-electric">Coming soon</Text>
            <Text className="mt-0.5 text-xs text-slate-500">
              Hosted cloud is being built — join the waitlist
            </Text>
          </View>
        )}

        {onDismiss && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Upgrade later"
            className="items-center py-2 active:opacity-70"
            onPress={onDismiss}
          >
            <Text className="text-sm font-bold text-slate-500">Upgrade later</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
