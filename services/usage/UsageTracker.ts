/**
 * UsageTracker — records and summarises every AI provider request.
 *
 * Storage: AsyncStorage (local, private, never sent to any server).
 * Capacity: up to MAX_EVENTS (ring buffer — oldest discarded first).
 * Fire-and-forget: record() never throws or blocks callers.
 *
 * This is the backend for the Usage & Cost Transparency UI.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import { createId } from "@/utils/createId";
import type { UsageEvent, UsageSummary } from "@/types/usage";
import {
  REFERENCE_COST_PER_TOKEN_USD,
  type UsageBySource,
  type UsageSource
} from "@/types/usage";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "screensmart:v2:usage_events";
const MAX_EVENTS = 200;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function readEvents(): Promise<UsageEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UsageEvent[]) : [];
  } catch {
    return [];
  }
}

async function writeEvents(events: UsageEvent[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Storage failures are non-fatal for usage tracking
  }
}

// ---------------------------------------------------------------------------
// Source classification
// ---------------------------------------------------------------------------

export function classifySource(
  providerId: string,
  costTier: string,
  isLocal: boolean
): UsageSource {
  if (providerId === "mock" || providerId === "none") return "mock";
  if (isLocal) return "local";
  if (costTier === "free") return "cloud_free";
  return "cloud_paid";
}

// ---------------------------------------------------------------------------
// Cost estimation
// ---------------------------------------------------------------------------

function estimateCost(source: UsageSource, tokens: number): number {
  if (source === "local" || source === "cloud_free" || source === "mock") return 0;
  return tokens * REFERENCE_COST_PER_TOKEN_USD;
}

// ---------------------------------------------------------------------------
// UsageTracker singleton
// ---------------------------------------------------------------------------

class UsageTrackerService {
  /**
   * Record a usage event.
   * Fire-and-forget — never throws, never blocks.
   */
  record(event: Omit<UsageEvent, "id" | "createdAt">): void {
    const full: UsageEvent = {
      ...event,
      id: createId("usage"),
      createdAt: new Date().toISOString()
    };

    // Async write, non-blocking
    void (async () => {
      const events = await readEvents();
      const next = [full, ...events].slice(0, MAX_EVENTS);
      await writeEvents(next);
    })();
  }

  /**
   * Build a complete UsageEvent from a ProviderRouter response.
   * Convenience wrapper so ProviderRouter doesn't need to know the types.
   */
  buildEvent(input: {
    providerId: string;
    providerName: string;
    providerIsLocal: boolean;
    providerCostTier: string;
    model?: string;
    capability: string;
    taskType: string;
    estimatedTokens?: number;
    durationMs?: number;
    success: boolean;
    fallbackUsed: boolean;
    requestedProviderId?: string;
    sessionId?: string;
    missionId?: string;
  }): Omit<UsageEvent, "id" | "createdAt"> {
    const source = classifySource(
      input.providerId,
      input.providerCostTier,
      input.providerIsLocal
    );
    const tokens = input.estimatedTokens ?? 0;

    return {
      providerId: input.providerId,
      providerName: input.providerName,
      model: input.model,
      capability: input.capability,
      taskType: input.taskType,
      source,
      estimatedTokens: tokens,
      estimatedCostUsd: estimateCost(source, tokens),
      durationMs: input.durationMs,
      success: input.success,
      fallbackUsed: input.fallbackUsed,
      requestedProviderId: input.requestedProviderId,
      sessionId: input.sessionId,
      missionId: input.missionId
    };
  }

  /**
   * Returns the most recent N events (default: 50).
   */
  async getAll(limit = 50): Promise<UsageEvent[]> {
    const events = await readEvents();
    return events.slice(0, limit);
  }

  /**
   * Returns a complete usage summary.
   */
  async getSummary(): Promise<UsageSummary> {
    const events = await readEvents();
    return computeSummary(events);
  }

  /**
   * Returns summary for a specific session.
   */
  async getSummaryForSession(sessionId: string): Promise<UsageSummary> {
    const events = await readEvents();
    return computeSummary(events.filter((e) => e.sessionId === sessionId));
  }

  /**
   * Clear all stored usage events.
   */
  async clear(): Promise<void> {
    await writeEvents([]);
  }

  /**
   * Returns the count of events per source — for quick display.
   */
  async getSourceCounts(): Promise<UsageBySource> {
    const events = await readEvents();
    return countBySource(events);
  }
}

// ---------------------------------------------------------------------------
// Summary computation
// ---------------------------------------------------------------------------

function computeSummary(events: UsageEvent[]): UsageSummary {
  if (events.length === 0) {
    return {
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
  }

  const bySource = countBySource(events);
  const totalCalls = events.length;
  const totalTokens = events.reduce((sum, e) => sum + (e.estimatedTokens ?? 0), 0);
  const totalCostUsd = events.reduce((sum, e) => sum + (e.estimatedCostUsd ?? 0), 0);

  // "Saved" = what local calls would have cost on a paid provider
  const localTokens = events
    .filter((e) => e.source === "local")
    .reduce((sum, e) => sum + (e.estimatedTokens ?? 0), 0);
  const estimatedSaved = localTokens * REFERENCE_COST_PER_TOKEN_USD;

  const successCount = events.filter((e) => e.success).length;
  const fallbackCount = events.filter((e) => e.fallbackUsed).length;
  const freeCount = bySource.local + bySource.cloud_free;

  const oldest = events[events.length - 1];

  return {
    totalCalls,
    bySource,
    totalEstimatedTokens: totalTokens,
    totalEstimatedCostUsd: totalCostUsd,
    estimatedSavedByLocalUsd: estimatedSaved,
    localPercentage: Math.round((bySource.local / totalCalls) * 100),
    freePercentage: Math.round((freeCount / totalCalls) * 100),
    successRate: Math.round((successCount / totalCalls) * 100),
    fallbackRate: Math.round((fallbackCount / totalCalls) * 100),
    since: oldest?.createdAt
  };
}

function countBySource(events: UsageEvent[]): UsageBySource {
  return events.reduce(
    (acc, e) => {
      acc[e.source] = (acc[e.source] ?? 0) + 1;
      return acc;
    },
    { local: 0, cloud_free: 0, cloud_paid: 0, mock: 0 } as UsageBySource
  );
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const usageTracker = new UsageTrackerService();
