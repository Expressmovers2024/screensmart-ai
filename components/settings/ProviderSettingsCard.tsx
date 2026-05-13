import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { routes } from "@/constants/routes";
import { providerRouter } from "@/src/providers";
import type { ProviderDescriptor, ProviderHealthStatus } from "@/src/providers";

type Props = {
  /** Refresh interval in ms. 0 = no auto-refresh. Default: 0 */
  refreshIntervalMs?: number;
};

type ProviderRow = ProviderDescriptor & {
  health?: ProviderHealthStatus;
};

export function ProviderSettingsCard({ refreshIntervalMs = 0 }: Props) {
  const router = useRouter();
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const refresh = useCallback(async () => {
    setIsChecking(true);
    try {
      const statuses = await providerRouter.runHealthChecks();
      const descriptors = providerRouter.getProviderDescriptors();
      const rows: ProviderRow[] = descriptors.map((d) => ({
        ...d,
        health: statuses.find((s) => s.providerId === d.id)
      }));
      setProviders(rows);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    if (refreshIntervalMs > 0) {
      const id = setInterval(() => void refresh(), refreshIntervalMs);
      return () => clearInterval(id);
    }
  }, [refresh, refreshIntervalMs]);

  const ollamaProvider = providers.find((p) => p.id === "ollama");
  const ollamaAvailable = ollamaProvider?.available ?? false;
  const fallbackChain = providerRouter.describeFallbackChain();
  const activeProvider = providers.find(
    (p) => p.available && p.id !== "mock" && !isScaffold(p)
  );

  return (
    <View className="rounded-[32px] border border-white/10 bg-white/10 p-6">
      {/* Header */}
      <View className="mb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-xs font-black uppercase tracking-[2px] text-electric">
            AI Providers
          </Text>
          <Text className="mt-1 text-xl font-black text-white">Provider Status</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh provider status"
          className="rounded-xl bg-electric/10 px-4 py-2 active:opacity-70"
          disabled={isChecking}
          onPress={refresh}
        >
          {isChecking ? (
            <ActivityIndicator size="small" color="#6EE7B7" />
          ) : (
            <Text className="text-xs font-black text-electric">Refresh</Text>
          )}
        </Pressable>
      </View>

      <View className="gap-4">
        {/* Active provider */}
        {activeProvider && (
          <View className="rounded-2xl border border-mint/20 bg-mint/5 p-4">
            <Text className="mb-1 text-xs font-black uppercase tracking-[1.5px] text-mint">
              Active provider
            </Text>
            <Text className="text-base font-bold text-white">{activeProvider.name}</Text>
            <Text className="mt-0.5 text-xs text-slate-400">
              {activeProvider.local ? "Local · " : "Cloud · "}
              {activeProvider.costTier} · {activeProvider.capabilities.slice(0, 3).join(", ")}
            </Text>
          </View>
        )}

        {/* Fallback order — always shown, reflects current ProviderRouter config */}
        <View className="rounded-2xl border border-white/5 bg-white/5 p-4">
          <Text className="mb-1 text-xs font-black uppercase tracking-[1.5px] text-slate-400">
            Fallback order
          </Text>
          <Text className="text-sm font-bold text-slate-300">{fallbackChain}</Text>
          <Text className="mt-1 text-xs text-slate-500">
            ScreenSmart tries each AI source in this order.
          </Text>
        </View>

        {/* Provider list */}
        {providers.length === 0 && isChecking ? (
          <View className="items-center py-4">
            <ActivityIndicator color="#6EE7B7" />
            <Text className="mt-2 text-xs text-slate-400">Checking providers...</Text>
          </View>
        ) : (
          <View className="gap-2">
            {providers.map((provider) => (
              <ProviderRowItem key={provider.id} provider={provider} />
            ))}
          </View>
        )}

        {/* Set up Local AI CTA */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Set up local AI with Ollama"
          className="active:opacity-70"
          onPress={() => router.push(routes.localAiSetup)}
        >
          <View
            className={`rounded-2xl border p-4 ${
              ollamaAvailable
                ? "border-mint/20 bg-mint/5"
                : "border-electric/20 bg-electric/5"
            }`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-sm font-black text-white">
                  {ollamaAvailable ? "Local AI is connected ✓" : "Set up Local AI"}
                </Text>
                <Text className="mt-1 text-xs leading-4 text-slate-400">
                  {ollamaAvailable
                    ? "Ollama is running locally. Tap to manage models and preferences."
                    : "Run AI models privately on your own device — free, offline, and secure."}
                </Text>
              </View>
              <Text
                className={`text-xs font-black ${
                  ollamaAvailable ? "text-mint" : "text-electric"
                }`}
              >
                {ollamaAvailable ? "Manage →" : "Set up →"}
              </Text>
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Row component
// ---------------------------------------------------------------------------

function ProviderRowItem({ provider }: { provider: ProviderRow }) {
  const scaffold = isScaffold(provider);
  const statusColor = scaffold
    ? "text-slate-500"
    : provider.available
    ? "text-mint"
    : "text-red-400";

  const statusLabel = scaffold
    ? "Coming soon"
    : provider.available
    ? "Available"
    : "Unavailable";

  return (
    <View className="flex-row items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3">
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-bold text-white">{provider.name}</Text>
          {provider.local && (
            <View className="rounded-full bg-mint/10 px-2 py-0.5">
              <Text className="text-xs font-black text-mint">LOCAL</Text>
            </View>
          )}
        </View>
        <Text className="mt-0.5 text-xs text-slate-500">
          {provider.costTier} ·{" "}
          {provider.capabilities.slice(0, 2).join(", ")}
          {provider.supportsVision ? " · vision" : ""}
          {provider.health?.latencyMs ? ` · ${provider.health.latencyMs}ms` : ""}
        </Text>
        {provider.health?.error && !provider.available && (
          <Text className="mt-0.5 text-xs text-red-400/80" numberOfLines={1}>
            {provider.health.error}
          </Text>
        )}
      </View>

      <View className="flex-row items-center gap-1.5">
        <View
          className={`h-2 w-2 rounded-full ${
            scaffold ? "bg-slate-600" : provider.available ? "bg-mint" : "bg-red-500"
          }`}
        />
        <Text className={`text-xs font-bold ${statusColor}`}>{statusLabel}</Text>
      </View>
    </View>
  );
}

function isScaffold(p: ProviderDescriptor): boolean {
  return p.id === "openai" || p.id === "anthropic";
}
