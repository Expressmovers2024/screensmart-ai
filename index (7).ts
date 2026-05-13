/**
 * GatedFeaturePanels — pre-built locked-state panels for each gated feature.
 *
 * Import these directly into future screens as placeholders.
 * When a feature ships, replace the panel with the real implementation
 * wrapped in <FeatureGate feature="...">real content</FeatureGate>.
 *
 * None of these components block OCR, summary, TalkBack, or missions.
 * They are purely additive — only visible in future screens/tabs.
 */

import { Text, View } from "react-native";

import { accessControl } from "@/services/plans";
import { PLAN_FEATURE_META } from "@/types/plans";

import { FeatureGate } from "./FeatureGate";
import { UpgradeCard } from "./UpgradeCard";

// ---------------------------------------------------------------------------
// Browser Operator gate (enterprise feature)
// ---------------------------------------------------------------------------

export function BrowserOperatorGate() {
  const ctx = accessControl.getUpgradeReason("browser_operator");
  if (!ctx) return null;
  return (
    <FeatureGate feature="browser_operator">
      <View />
    </FeatureGate>
  );
}

// ---------------------------------------------------------------------------
// Cloud Sync gate (pro_cloud feature)
// ---------------------------------------------------------------------------

export function CloudSyncGate() {
  return (
    <FeatureGate feature="cloud_sync">
      {/* Replace with real CloudSyncPanel when available */}
      <View className="rounded-2xl bg-white/5 p-4">
        <Text className="text-sm text-slate-300">Cloud sync enabled.</Text>
      </View>
    </FeatureGate>
  );
}

// ---------------------------------------------------------------------------
// Advanced Memory gate (pro_cloud feature)
// ---------------------------------------------------------------------------

export function AdvancedMemoryGate() {
  return (
    <FeatureGate feature="advanced_memory">
      {/* Replace with real MemoryPanel when available */}
      <View className="rounded-2xl bg-white/5 p-4">
        <Text className="text-sm text-slate-300">Cross-session memory active.</Text>
      </View>
    </FeatureGate>
  );
}

// ---------------------------------------------------------------------------
// Priority Models gate (pro_cloud feature)
// ---------------------------------------------------------------------------

export function PriorityModelsGate() {
  return (
    <FeatureGate feature="priority_models">
      {/* Replace with real PriorityModelSelector when available */}
      <View className="rounded-2xl bg-white/5 p-4">
        <Text className="text-sm text-slate-300">Priority model routing active.</Text>
      </View>
    </FeatureGate>
  );
}

// ---------------------------------------------------------------------------
// Hosted Cloud AI gate (pro_cloud feature) — shown in provider settings
// ---------------------------------------------------------------------------

export function HostedCloudAiGate() {
  const ctx = accessControl.getUpgradeReason("hosted_cloud_ai");
  if (!ctx) return null;
  return <UpgradeCard context={ctx} />;
}

// ---------------------------------------------------------------------------
// Team Workspaces gate (team feature)
// ---------------------------------------------------------------------------

export function TeamWorkspacesGate() {
  return (
    <FeatureGate feature="team_workspaces">
      <View className="rounded-2xl bg-white/5 p-4">
        <Text className="text-sm text-slate-300">Team workspace active.</Text>
      </View>
    </FeatureGate>
  );
}
