import { type ReactNode, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { accessControl } from "@/services/plans";
import { PLAN_FEATURE_META } from "@/types/plans";
import type { PlanFeature } from "@/types/plans";

import { UpgradeCard } from "./UpgradeCard";

type FeatureGateProps = {
  feature: PlanFeature;
  /** Content rendered when the feature is available */
  children: ReactNode;
  /**
   * Optional custom locked state. If omitted, renders the default
   * locked card with upgrade prompt.
   */
  fallback?: ReactNode;
  /**
   * When true, renders children but wraps them in a disabled overlay.
   * When false (default), replaces children with the locked card.
   */
  overlay?: boolean;
};

/**
 * FeatureGate — conditionally renders children based on plan access.
 *
 * Usage:
 *   <FeatureGate feature="cloud_sync">
 *     <CloudSyncPanel />
 *   </FeatureGate>
 *
 *   <FeatureGate feature="browser_operator" fallback={<MyCustomLockedView />}>
 *     <BrowserOperatorUI />
 *   </FeatureGate>
 */
export function FeatureGate({
  feature,
  children,
  fallback,
  overlay = false
}: FeatureGateProps) {
  const hasAccess = accessControl.hasFeature(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (overlay) {
    return <LockedOverlay feature={feature}>{children}</LockedOverlay>;
  }

  return <LockedCard feature={feature} />;
}

// ---------------------------------------------------------------------------
// Locked card — default locked state
// ---------------------------------------------------------------------------

function LockedCard({ feature }: { feature: PlanFeature }) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const meta = PLAN_FEATURE_META[feature];
  const upgradeContext = accessControl.getUpgradeReason(feature);

  if (showUpgrade && upgradeContext) {
    return (
      <UpgradeCard
        context={upgradeContext}
        onDismiss={() => setShowUpgrade(false)}
      />
    );
  }

  return (
    <View className="rounded-[32px] border border-white/10 bg-white/5 p-6">
      {/* Lock indicator */}
      <View className="mb-4 flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
          <Text className="text-xl">{meta.emoji}</Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-black text-white">{meta.label}</Text>
            <View className="rounded-full bg-slate-700 px-2 py-0.5">
              <Text className="text-xs font-black text-slate-400">🔒 Locked</Text>
            </View>
          </View>
          <Text className="mt-0.5 text-xs text-slate-500">{meta.description}</Text>
        </View>
      </View>

      {/* Contextual benefit teaser */}
      {upgradeContext && (
        <View className="mb-4 rounded-2xl bg-white/5 p-4">
          <Text className="text-sm leading-5 text-slate-400">
            {upgradeContext.benefit}
          </Text>
        </View>
      )}

      {/* Required plan */}
      {upgradeContext && (
        <View className="mb-4">
          <Text className="mb-1 text-xs font-black uppercase tracking-[1.5px] text-slate-500">
            Available in
          </Text>
          <Text className="text-sm font-bold text-white">
            {upgradeContext.suggestedPlan.name}
            {upgradeContext.suggestedPlan.priceMonthlyUsd !== undefined
              ? ` · $${upgradeContext.suggestedPlan.priceMonthlyUsd}/mo`
              : " · Custom pricing"}
          </Text>
        </View>
      )}

      {/* CTA */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="See upgrade options"
        className="min-h-12 items-center justify-center rounded-2xl border border-electric/30 bg-electric/10 px-4 py-3 active:opacity-70"
        onPress={() => setShowUpgrade(true)}
      >
        <Text className="text-sm font-black text-electric">
          {upgradeContext?.suggestedPlan.available
            ? upgradeContext.suggestedPlan.upgradeLabel
            : "See what's coming"}
        </Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Locked overlay — shows content but prevents interaction
// ---------------------------------------------------------------------------

function LockedOverlay({
  feature,
  children
}: {
  feature: PlanFeature;
  children: ReactNode;
}) {
  const meta = PLAN_FEATURE_META[feature];
  const upgradeContext = accessControl.getUpgradeReason(feature);
  const [showUpgrade, setShowUpgrade] = useState(false);

  return (
    <View className="relative">
      {/* Dimmed children */}
      <View className="opacity-30" pointerEvents="none">
        {children}
      </View>

      {/* Overlay */}
      <View className="absolute inset-0 items-center justify-center rounded-[32px] bg-ink/80">
        {showUpgrade && upgradeContext ? (
          <View className="w-full p-4">
            <UpgradeCard
              context={upgradeContext}
              onDismiss={() => setShowUpgrade(false)}
            />
          </View>
        ) : (
          <View className="items-center gap-3 px-8">
            <Text className="text-4xl">{meta.emoji}</Text>
            <Text className="text-center text-lg font-black text-white">{meta.label}</Text>
            <Text className="text-center text-xs leading-5 text-slate-400">
              {upgradeContext?.headline ?? meta.description}
            </Text>
            <Pressable
              className="mt-2 rounded-2xl bg-electric px-6 py-3 active:opacity-80"
              onPress={() => setShowUpgrade(true)}
            >
              <Text className="font-black text-ink">
                {upgradeContext?.suggestedPlan.available
                  ? upgradeContext.suggestedPlan.upgradeLabel
                  : "Coming soon"}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
