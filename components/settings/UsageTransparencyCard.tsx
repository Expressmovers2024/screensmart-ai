import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { usageTracker } from "@/services/usage";
import type { UsageEvent, UsageSummary } from "@/types/usage";

const EMPTY_SUMMARY: UsageSummary = {
  totalCalls: 0,
  bySource: { local: 0, cloud_free: 0, cloud_paid: 0, mock: 0 },
  totalEstimatedTokens: 0,
  totalEstimatedCostUsd: 0,
  estimatedSavedByLocalUsd: 0,
  localPercentage: 0,
  freePercentage: 0,
  successRate: 0,
  fallbackRate: 0
};

export function UsageTransparencyCard() {
  const [summary, setSummary] = useState<UsageSummary>(EMPTY_SUMMARY);
  const [recentEvents, setRecentEvents] = useState<UsageEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [s, events] = await Promise.all([
        usageTracker.getSummary(),
        usageTracker.getAll(10)
      ]);
      setSummary(s);
      setRecentEvents(events);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleClear = async () => {
    setIsClearing(true);
    try {
      await usageTracker.clear();
      setSummary(EMPTY_SUMMARY);
      setRecentEvents([]);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <View className="rounded-[32px] border border-white/10 bg-white/10 p-6">

      {/* Header */}
      <View className="mb-5 flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-xs font-black uppercase tracking-[2px] text-electric">
            Usage & Cost
          </Text>
          <Text className="mt-1 text-xl font-black leading-tight text-white">
            Where every request went
          </Text>
          <Text className="mt-1 text-xs leading-5 text-slate-500">
            ScreenSmart shows you where every AI request goes.
            No hidden cloud calls, no surprise credits.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh usage data"
          className="rounded-xl bg-electric/10 px-3 py-2 active:opacity-70"
          disabled={isLoading}
          onPress={load}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#6EE7B7" />
          ) : (
            <Text className="text-xs font-black text-electric">Refresh</Text>
          )}
        </Pressable>
      </View>

      {summary.totalCalls === 0 && !isLoading ? (
        <EmptyState />
      ) : (
        <View className="gap-4">
          {/* Source breakdown */}
          <View className="gap-2">
            <Text className="text-xs font-black uppercase tracking-[1.5px] text-slate-400">
              By source · {summary.totalCalls} total call{summary.totalCalls !== 1 ? "s" : ""}
            </Text>
            <SourceRow
              label="Local Ollama"
              sublabel="Your device · private · free"
              count={summary.bySource.local}
              total={summary.totalCalls}
              accentClass="bg-mint"
              labelClass="text-mint"
              emoji="🏠"
            />
            <SourceRow
              label="OpenRouter Free"
              sublabel="Cloud · free tier · no charge"
              count={summary.bySource.cloud_free}
              total={summary.totalCalls}
              accentClass="bg-electric"
              labelClass="text-electric"
              emoji="☁️"
            />
            <SourceRow
              label="Paid Cloud"
              sublabel="Cloud · billed per token"
              count={summary.bySource.cloud_paid}
              total={summary.totalCalls}
              accentClass="bg-yellow-500"
              labelClass="text-yellow-400"
              emoji="💳"
            />
            <SourceRow
              label="Mock Fallback"
              sublabel="Offline placeholder · no AI"
              count={summary.bySource.mock}
              total={summary.totalCalls}
              accentClass="bg-slate-500"
              labelClass="text-slate-400"
              emoji="🤖"
            />
          </View>

          {/* Stats row */}
          <View className="flex-row gap-2">
            <StatChip
              label="Free calls"
              value={`${summary.freePercentage}%`}
              accent="text-mint"
            />
            <StatChip
              label="Success rate"
              value={`${summary.successRate}%`}
              accent="text-electric"
            />
            {summary.fallbackRate > 0 && (
              <StatChip
                label="Fallback rate"
                value={`${summary.fallbackRate}%`}
                accent="text-yellow-400"
              />
            )}
          </View>

          {/* Cost savings — only shown when local AI has been used */}
          {summary.bySource.local > 0 && (
            <View className="rounded-2xl border border-mint/20 bg-mint/5 p-4">
              <Text className="mb-1 text-xs font-black uppercase tracking-[1.5px] text-mint">
                Estimated savings from local AI
              </Text>
              <Text className="text-2xl font-black text-white">
                ${summary.estimatedSavedByLocalUsd.toFixed(4)}
              </Text>
              <Text className="mt-1 text-xs leading-4 text-slate-400">
                Estimated cost if those {summary.bySource.local} local call
                {summary.bySource.local !== 1 ? "s" : ""} had used a paid cloud model.
                Reference rate: $0.000003 per token.
              </Text>
            </View>
          )}

          {/* Tokens summary */}
          {summary.totalEstimatedTokens > 0 && (
            <View className="rounded-2xl bg-white/5 p-3">
              <Text className="text-xs font-black uppercase tracking-[1.5px] text-slate-400">
                Estimated tokens processed
              </Text>
              <Text className="mt-1 text-base font-black text-white">
                {summary.totalEstimatedTokens.toLocaleString()}
              </Text>
              {summary.totalEstimatedCostUsd > 0 && (
                <Text className="text-xs text-slate-500">
                  Estimated cost: ${summary.totalEstimatedCostUsd.toFixed(6)} USD
                </Text>
              )}
            </View>
          )}

          {/* Recent events */}
          {recentEvents.length > 0 && (
            <View>
              <Text className="mb-2 text-xs font-black uppercase tracking-[1.5px] text-slate-400">
                Last {recentEvents.length} request{recentEvents.length !== 1 ? "s" : ""}
              </Text>
              <View className="gap-1.5">
                {recentEvents.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </View>
            </View>
          )}

          {/* Clear button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear usage history"
            className="active:opacity-70"
            disabled={isClearing || summary.totalCalls === 0}
            onPress={() => void handleClear()}
          >
            <Text
              className={`text-center text-xs font-bold ${
                summary.totalCalls === 0 ? "text-slate-600" : "text-red-400/70"
              }`}
            >
              {isClearing ? "Clearing..." : "Clear usage history"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <View className="items-center gap-3 py-6">
      <Text className="text-3xl">📊</Text>
      <Text className="text-sm font-bold text-slate-400">No requests yet</Text>
      <Text className="max-w-xs text-center text-xs leading-5 text-slate-500">
        Usage data appears here after ScreenSmart makes its first AI request.
        Summarise a screen or ask TalkBack a question to get started.
      </Text>
    </View>
  );
}

function SourceRow({
  label,
  sublabel,
  count,
  total,
  accentClass,
  labelClass,
  emoji
}: {
  label: string;
  sublabel: string;
  count: number;
  total: number;
  accentClass: string;
  labelClass: string;
  emoji: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <View className="rounded-xl border border-white/5 bg-white/5 px-4 py-3">
      <View className="mb-1.5 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="text-base">{emoji}</Text>
          <View>
            <Text className="text-xs font-bold text-white">{label}</Text>
            <Text className="text-xs text-slate-500">{sublabel}</Text>
          </View>
        </View>
        <View className="items-end">
          <Text className={`text-sm font-black ${labelClass}`}>{count}</Text>
          <Text className="text-xs text-slate-500">{pct}%</Text>
        </View>
      </View>
      {/* Progress bar */}
      <View className="h-1 overflow-hidden rounded-full bg-white/10">
        <View
          className={`h-1 rounded-full ${accentClass}`}
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}

function StatChip({
  label,
  value,
  accent
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <View className="flex-1 rounded-xl bg-white/5 px-3 py-2.5">
      <Text className={`text-base font-black ${accent}`}>{value}</Text>
      <Text className="text-xs text-slate-500">{label}</Text>
    </View>
  );
}

function EventRow({ event }: { event: UsageEvent }) {
  const sourceConfig = {
    local: { dot: "bg-mint", label: "Local", labelClass: "text-mint" },
    cloud_free: { dot: "bg-electric", label: "Free cloud", labelClass: "text-electric" },
    cloud_paid: { dot: "bg-yellow-500", label: "Paid cloud", labelClass: "text-yellow-400" },
    mock: { dot: "bg-slate-500", label: "Mock", labelClass: "text-slate-400" }
  }[event.source];

  const timeAgo = formatRelativeTime(event.createdAt);
  const model = event.model ? truncate(event.model, 28) : null;

  return (
    <View className="flex-row items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
      <View className={`h-2 w-2 flex-shrink-0 rounded-full ${sourceConfig.dot}`} />
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center gap-2">
          <Text className={`text-xs font-bold ${sourceConfig.labelClass}`}>
            {sourceConfig.label}
          </Text>
          <Text className="text-xs text-slate-500">·</Text>
          <Text className="flex-1 text-xs text-slate-400" numberOfLines={1}>
            {event.taskType.replace(/_/g, " ")}
          </Text>
        </View>
        {model && (
          <Text className="mt-0.5 text-xs text-slate-600" numberOfLines={1}>
            {model}
          </Text>
        )}
      </View>
      <View className="items-end gap-0.5 flex-shrink-0">
        <Text className="text-xs text-slate-500">{timeAgo}</Text>
        {event.durationMs !== undefined && (
          <Text className="text-xs text-slate-600">{event.durationMs}ms</Text>
        )}
        {!event.success && (
          <Text className="text-xs text-red-400">failed</Text>
        )}
        {event.fallbackUsed && event.success && (
          <Text className="text-xs text-yellow-500">fallback</Text>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function truncate(str: string, max: number): string {
  return str.length <= max ? str : `…${str.slice(-(max - 1))}`;
}
