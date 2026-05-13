/**
 * AccessControl — runtime feature and limit checking for ScreenSmart plans.
 *
 * Design:
 *   - Current plan is stored in AsyncStorage under a dedicated key.
 *   - Defaults to free_local with no backend call needed.
 *   - All feature checks are synchronous after the initial load.
 *   - When billing is integrated, replace loadPlan() to fetch from API.
 *
 * Usage:
 *   const ac = accessControl;
 *   ac.hasFeature("cloud_sync")          // → false on free_local
 *   ac.canUseFeature("mission_control")  // → true on free_local
 *   ac.getUpgradeReason("cloud_sync")    // → UpgradeContext for upgrade UI
 *   ac.isWithinLimit("savedSessions", 87)// → true (limit is 100)
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import type { PlanFeature, PlanLimits, PlanTier, UpgradeContext } from "@/types/plans";
import { PLAN_FEATURE_META } from "@/types/plans";
import {
  FREE_LOCAL_PLAN,
  PRO_CLOUD_PLAN,
  getMinimumTierForFeature,
  getPlan,
  tierIsAtLeast
} from "./PlanRegistry";
import type { UserPlan } from "@/types/plans";

const PLAN_STORAGE_KEY = "screensmart:v2:current_plan";

class AccessControlService {
  private _currentPlan: UserPlan = FREE_LOCAL_PLAN;
  private _loaded = false;

  // ---------------------------------------------------------------------------
  // Initialisation — call once on app start
  // ---------------------------------------------------------------------------

  /**
   * Load the user's plan from storage.
   * Call this in the root layout or app provider.
   * Falls back to free_local silently if storage fails.
   */
  async loadPlan(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(PLAN_STORAGE_KEY);
      if (raw) {
        const tier = JSON.parse(raw) as PlanTier;
        this._currentPlan = getPlan(tier);
      }
    } catch {
      // Non-fatal — default to free_local
    } finally {
      this._loaded = true;
    }
  }

  /**
   * Override the current plan.
   * For development/testing only — real billing will replace this.
   */
  async setPlan(tier: PlanTier): Promise<void> {
    this._currentPlan = getPlan(tier);
    try {
      await AsyncStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(tier));
    } catch {
      // Non-fatal
    }
  }

  // ---------------------------------------------------------------------------
  // Plan access
  // ---------------------------------------------------------------------------

  getCurrentPlan(): UserPlan {
    return this._currentPlan;
  }

  getCurrentTier(): PlanTier {
    return this._currentPlan.tier;
  }

  isLoaded(): boolean {
    return this._loaded;
  }

  // ---------------------------------------------------------------------------
  // Feature checks
  // ---------------------------------------------------------------------------

  /**
   * Returns true if the current plan includes this feature.
   * Use this for UI visibility decisions.
   */
  hasFeature(feature: PlanFeature): boolean {
    return this._currentPlan.features.includes(feature);
  }

  /**
   * Returns true if the user can use this feature right now.
   * Same as hasFeature for most cases — extend here for
   * quota-based checks when billing is integrated.
   */
  canUseFeature(feature: PlanFeature): boolean {
    return this.hasFeature(feature);
  }

  /**
   * Returns the set of features the current plan includes.
   */
  getIncludedFeatures(): PlanFeature[] {
    return [...this._currentPlan.features];
  }

  /**
   * Returns the set of features locked on the current plan.
   */
  getLockedFeatures(): PlanFeature[] {
    const all: PlanFeature[] = [
      "local_ai",
      "cloud_free_fallback",
      "hosted_cloud_ai",
      "mission_control",
      "research_intelligence",
      "browser_operator",
      "cloud_sync",
      "advanced_memory",
      "priority_models",
      "team_workspaces"
    ];
    return all.filter((f) => !this.hasFeature(f));
  }

  // ---------------------------------------------------------------------------
  // Upgrade context
  // ---------------------------------------------------------------------------

  /**
   * Returns a structured upgrade reason for a locked feature.
   * Used by FeatureGate and UpgradeCard to display contextual messaging.
   * Returns undefined if the feature is already included in the current plan.
   */
  getUpgradeReason(feature: PlanFeature): UpgradeContext | undefined {
    if (this.hasFeature(feature)) return undefined;

    const requiredTier = getMinimumTierForFeature(feature);
    if (!requiredTier) return undefined;

    const suggestedPlan = getPlan(requiredTier);
    const meta = PLAN_FEATURE_META[feature];

    const headlines: Partial<Record<PlanFeature, string>> = {
      hosted_cloud_ai: "Premium AI models, hosted for you",
      cloud_sync: "Your sessions, everywhere",
      advanced_memory: "AI that remembers your context",
      priority_models: "Faster, smarter models on demand",
      browser_operator: "Let AI browse the web for you",
      team_workspaces: "Bring your whole team onto ScreenSmart"
    };

    const benefits: Partial<Record<PlanFeature, string>> = {
      hosted_cloud_ai:
        "Get GPT-4o and Claude quality without managing your own infrastructure. " +
        "ScreenSmart handles the hosting so you can focus on the work.",
      cloud_sync:
        "Everything you capture on one device instantly available on all others. " +
        "No manual export, no email to yourself.",
      advanced_memory:
        "ScreenSmart learns from your sessions and surfaces relevant history automatically. " +
        "Stop re-explaining context every time.",
      priority_models:
        "Skip the queue and get routed to the fastest, most capable models. " +
        "Meaningful difference on large OCR documents and complex research tasks.",
      browser_operator:
        "Point ScreenSmart at a URL and let it read, summarise, and extract information " +
        "without you scrolling through pages yourself.",
      team_workspaces:
        "Shared missions and team memory mean everyone benefits from collective screen intelligence. " +
        "One team, one knowledge base."
    };

    return {
      feature,
      currentTier: this._currentPlan.tier,
      requiredTier,
      headline: headlines[feature] ?? meta.label,
      benefit: benefits[feature] ?? meta.description,
      suggestedPlan
    };
  }

  // ---------------------------------------------------------------------------
  // Limits
  // ---------------------------------------------------------------------------

  getPlanLimits(): PlanLimits {
    return { ...this._currentPlan.limits };
  }

  /**
   * Returns true if the current usage count is within the plan limit.
   * Returns true if no limit is defined for this metric on the current plan.
   */
  isWithinLimit(limitName: keyof PlanLimits, currentCount: number): boolean {
    const limit = this._currentPlan.limits[limitName];
    if (limit === undefined) return true; // no cap
    return currentCount < limit;
  }

  /**
   * Returns the limit value for a given metric, or undefined if unlimited.
   */
  getLimit(limitName: keyof PlanLimits): number | undefined {
    return this._currentPlan.limits[limitName];
  }

  /**
   * Returns the first plan that the user could upgrade to.
   * Returns undefined if already on the highest tier.
   */
  getNextUpgradePlan(): UserPlan | undefined {
    if (tierIsAtLeast(this._currentPlan.tier, "enterprise")) return undefined;
    const next =
      this._currentPlan.tier === "free_local"
        ? PRO_CLOUD_PLAN
        : this._currentPlan.tier === "pro_cloud"
        ? getPlan("team")
        : getPlan("enterprise");
    return next;
  }
}

/** Singleton — import and use throughout the app */
export const accessControl = new AccessControlService();
