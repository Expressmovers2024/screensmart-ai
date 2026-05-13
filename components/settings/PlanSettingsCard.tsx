import { Text, View } from "react-native";

import { accessControl, ALL_PLANS } from "@/services/plans";
import { PLAN_FEATURE_META } from "@/types/plans";
import type { PlanFeature, UserPlan } from "@/types/plans";

import { PlanBadge } from "@/components/plans/PlanBadge";
import { UpgradeCard } from "@/components/plans/UpgradeCard";

export function PlanSettingsCard() {
  const plan = accessControl.getCurrentPlan();
  const limits = accessControl.getPlanLimits();
  const lockedFeatures = accessControl.getLockedFeatures();
  const nextPlan = accessControl.getNextUpgradePlan();

  return (
    <View className="rounded-[32px] border border-white/10 bg-white/10 p-6">
      {/* Header */}
      <View className="mb-5">
        <Text className="text-xs font-black uppercase tracking-[2px] text-electric">
          Your Plan
        </Text>
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-xl font-black text-white">{plan.name}</Text>
          <PlanBadge tier={plan.tier} size="md" />
        </View>
        {/* Business positioning */}
        <Text className="mt-2 text-xs leading-5 text-slate-500">
          Free when you run it locally. Paid when we run the infrastructure for you.
        </Text>
      </View>

      <View className="gap-4">
        {/* Plan tagline */}
        <View className="rounded-2xl bg-white/5 p-4">
          <Text className="text-sm leading-6 text-slate-300">{plan.description}</Text>
        </View>

        {/* Included features */}
        <View>
          <Text className="mb-2 text-xs font-black uppercase tracking-[1.5px] text-slate-400">
            Included in your plan
          </Text>
          <View className="gap-1.5">
            {plan.features.map((feature) => (
              <IncludedFeatureRow key={feature} feature={feature} />
            ))}
          </View>
        </View>

        {/* Usage limits */}
        {hasAnyLimit(limits) && (
          <View>
            <Text className="mb-2 text-xs font-black uppercase tracking-[1.5px] text-slate-400">
              Usage limits
            </Text>
            <View className="gap-1.5">
              {limits.savedSessions !== undefined && (
                <LimitRow label="Saved sessions" value={limits.savedSessions} />
              )}
              {limits.missions !== undefined && (
                <LimitRow label="Active missions" value={limits.missions} />
              )}
              {limits.cloudRequestsPerDay !== undefined && (
                <LimitRow
                  label="Free cloud requests / day"
                  value={limits.cloudRequestsPerDay}
                />
              )}
              {limits.researchResults !== undefined && (
                <LimitRow label="Research results" value={limits.researchResults} />
              )}
            </View>
          </View>
        )}

        {/* Locked features — teaser */}
        {lockedFeatures.length > 0 && (
          <View>
            <Text className="mb-2 text-xs font-black uppercase tracking-[1.5px] text-slate-400">
              Available on higher plans
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {lockedFeatures.map((feature) => {
                const meta = PLAN_FEATURE_META[feature];
                return (
                  <View
                    key={feature}
                    className="flex-row items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"
                  >
                    <Text className="text-sm">{meta.emoji}</Text>
                    <Text className="text-xs font-bold text-slate-500">{meta.label}</Text>
                    <Text className="text-xs text-slate-600">🔒</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Plan progression */}
        <View>
          <Text className="mb-2 text-xs font-black uppercase tracking-[1.5px] text-slate-400">
            Plan progression
          </Text>
          <View className="flex-row gap-1.5">
            {ALL_PLANS.map((p, index) => (
              <PlanStep
                key={p.tier}
                plan={p}
                isCurrent={p.tier === plan.tier}
                isCompleted={index < ALL_PLANS.findIndex((x) => x.tier === plan.tier)}
              />
            ))}
          </View>
        </View>

        {/* Upgrade section — only shown if there's a next plan */}
        {nextPlan && (
          <View>
            <Text className="mb-3 text-xs font-black uppercase tracking-[1.5px] text-slate-400">
              Next: {nextPlan.name}
            </Text>
            {!nextPlan.available ? (
              <ComingSoonCard plan={nextPlan} />
            ) : (
              nextPlan &&
              lockedFeatures[0] &&
              (() => {
                const ctx = accessControl.getUpgradeReason(lockedFeatures[0]);
                return ctx ? <UpgradeCard context={ctx} /> : null;
              })()
            )}
          </View>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function IncludedFeatureRow({ feature }: { feature: PlanFeature }) {
  const meta = PLAN_FEATURE_META[feature];
  return (
    <View className="flex-row items-center gap-3 rounded-xl bg-white/5 px-4 py-2.5">
      <Text className="text-base">{meta.emoji}</Text>
      <View className="flex-1">
        <Text className="text-sm font-bold text-white">{meta.label}</Text>
        <Text className="text-xs text-slate-500" numberOfLines={1}>
          {meta.description}
        </Text>
      </View>
      <View className="h-2 w-2 rounded-full bg-mint" />
    </View>
  );
}

function LimitRow({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-row items-center justify-between rounded-xl bg-white/5 px-4 py-2.5">
      <Text className="text-sm text-slate-400">{label}</Text>
      <Text className="text-sm font-black text-white">{value.toLocaleString()}</Text>
    </View>
  );
}

function PlanStep({
  plan,
  isCurrent,
  isCompleted
}: {
  plan: UserPlan;
  isCurrent: boolean;
  isCompleted: boolean;
}) {
  return (
    <View className="flex-1 items-center gap-1">
      <View
        className={`h-2 w-full rounded-full ${
          isCurrent
            ? "bg-electric"
            : isCompleted
            ? "bg-mint"
            : "bg-white/10"
        }`}
      />
      <Text
        className={`text-xs font-bold ${
          isCurrent ? "text-electric" : isCompleted ? "text-mint" : "text-slate-600"
        }`}
        numberOfLines={1}
      >
        {plan.name.split(" ")[0]}
      </Text>
    </View>
  );
}

function ComingSoonCard({ plan }: { plan: UserPlan }) {
  return (
    <View className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-sm font-black text-white">{plan.name}</Text>
        <View className="rounded-full bg-slate-700 px-2 py-0.5">
          <Text className="text-xs font-black text-slate-400">Coming soon</Text>
        </View>
      </View>
      <Text className="mb-3 text-xs leading-5 text-slate-400">{plan.tagline}</Text>
      <View className="gap-1">
        {plan.features.slice(0, 3).map((f) => {
          const meta = PLAN_FEATURE_META[f];
          return (
            <View key={f} className="flex-row items-center gap-2">
              <Text className="text-sm">{meta.emoji}</Text>
              <Text className="text-xs text-slate-500">{meta.label}</Text>
            </View>
          );
        })}
        {plan.features.length > 3 && (
          <Text className="text-xs text-slate-600">
            + {plan.features.length - 3} more
          </Text>
        )}
      </View>
      {plan.priceMonthlyUsd !== undefined && (
        <Text className="mt-3 text-xs text-slate-500">
          ${plan.priceMonthlyUsd}/month when available
        </Text>
      )}
    </View>
  );
}

function hasAnyLimit(limits: ReturnType<typeof accessControl.getPlanLimits>): boolean {
  return Object.values(limits).some((v) => v !== undefined);
}
