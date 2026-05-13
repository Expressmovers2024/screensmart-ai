/**
 * PlanRegistry — defines all ScreenSmart AI OS plan tiers.
 *
 * These are the source of truth for what each tier includes.
 * AccessControl reads from this registry to check feature access.
 *
 * Pricing and availability are managed here until a billing backend
 * is integrated. Set available: false for tiers not yet purchasable.
 */

import type { PlanFeature, PlanTier, UserPlan } from "@/types/plans";

// ---------------------------------------------------------------------------
// Plan definitions
// ---------------------------------------------------------------------------

export const FREE_LOCAL_PLAN: UserPlan = {
  tier: "free_local",
  name: "Free Local",
  tagline: "Free when you run it locally",
  description:
    "The full ScreenSmart experience powered by AI on your own machine. " +
    "OCR, vision analysis, summaries, TalkBack, research planning, and basic missions — " +
    "all free, all private, no cloud charges.",
  features: [
    "local_ai",
    "cloud_free_fallback",
    "mission_control",
    "research_intelligence"
  ],
  limits: {
    savedSessions: 100,
    missions: 10,
    researchResults: 50,
    cloudRequestsPerDay: 30
  },
  priceMonthlyUsd: undefined, // free forever
  upgradeLabel: "Upgrade to Pro",
  available: true
};

export const PRO_CLOUD_PLAN: UserPlan = {
  tier: "pro_cloud",
  name: "Pro Cloud",
  tagline: "Paid when we run the infrastructure",
  description:
    "ScreenSmart hosted and managed. Premium AI models, cloud sync, advanced memory, " +
    "and unlimited sessions — without needing to run anything locally.",
  features: [
    "local_ai",
    "cloud_free_fallback",
    "hosted_cloud_ai",
    "mission_control",
    "research_intelligence",
    "cloud_sync",
    "advanced_memory",
    "priority_models"
  ],
  limits: {
    // No hard limits on sessions or missions for Pro
    cloudRequestsPerDay: 500,
    teamMembers: 1
  },
  priceMonthlyUsd: 12,
  upgradeLabel: "Get Pro",
  available: false // billing not yet wired
};

export const TEAM_PLAN: UserPlan = {
  tier: "team",
  name: "Team",
  tagline: "Shared AI OS for your organisation",
  description:
    "Everything in Pro plus shared workspaces, collaborative missions, and team-level " +
    "memory so your whole team benefits from collective screen intelligence.",
  features: [
    "local_ai",
    "cloud_free_fallback",
    "hosted_cloud_ai",
    "mission_control",
    "research_intelligence",
    "cloud_sync",
    "advanced_memory",
    "priority_models",
    "team_workspaces"
  ],
  limits: {
    cloudRequestsPerDay: 2000,
    teamMembers: 25
  },
  priceMonthlyUsd: 49,
  upgradeLabel: "Start Team trial",
  available: false
};

export const ENTERPRISE_PLAN: UserPlan = {
  tier: "enterprise",
  name: "Enterprise",
  tagline: "Private deployment, custom models, full compliance",
  description:
    "ScreenSmart deployed in your own infrastructure. Bring your own models, " +
    "configure compliance boundaries, and integrate with your existing tooling.",
  features: [
    "local_ai",
    "cloud_free_fallback",
    "hosted_cloud_ai",
    "mission_control",
    "research_intelligence",
    "cloud_sync",
    "advanced_memory",
    "priority_models",
    "team_workspaces",
    "browser_operator"
  ],
  limits: {
    // Unlimited — custom contract
  },
  priceMonthlyUsd: undefined, // custom pricing
  upgradeLabel: "Contact us",
  available: false
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const PLAN_MAP: Record<PlanTier, UserPlan> = {
  free_local: FREE_LOCAL_PLAN,
  pro_cloud: PRO_CLOUD_PLAN,
  team: TEAM_PLAN,
  enterprise: ENTERPRISE_PLAN
};

/**
 * All plans ordered from cheapest to most capable.
 * Used in upgrade UI to show the progression.
 */
export const ALL_PLANS: UserPlan[] = [
  FREE_LOCAL_PLAN,
  PRO_CLOUD_PLAN,
  TEAM_PLAN,
  ENTERPRISE_PLAN
];

export function getPlan(tier: PlanTier): UserPlan {
  return PLAN_MAP[tier] ?? FREE_LOCAL_PLAN;
}

/**
 * Returns the minimum plan tier that includes a given feature.
 * Returns undefined if no plan includes the feature (shouldn't happen).
 */
export function getMinimumTierForFeature(
  feature: PlanFeature
): PlanTier | undefined {
  const found = ALL_PLANS.find((p) => p.features.includes(feature));
  return found?.tier;
}

/**
 * TIER_ORDER — used for comparison (higher = more capable).
 */
export const TIER_ORDER: Record<PlanTier, number> = {
  free_local: 0,
  pro_cloud: 1,
  team: 2,
  enterprise: 3
};

export function tierIsAtLeast(current: PlanTier, required: PlanTier): boolean {
  return TIER_ORDER[current] >= TIER_ORDER[required];
}
