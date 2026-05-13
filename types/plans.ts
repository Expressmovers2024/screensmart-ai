/**
 * ScreenSmart AI OS — Plan & Access Control types
 *
 * Business model:
 *   "Free when you run it locally. Paid when we run the infrastructure for you."
 *
 * Tiers:
 *   free_local  — Default. Local AI + OpenRouter free. No cloud hosting charges.
 *   pro_cloud   — Hosted cloud AI, sync, advanced memory. Monthly subscription.
 *   team        — Shared workspaces, collaborative missions. Per-seat pricing.
 *   enterprise  — Private deployment, custom models, compliance. Custom contract.
 *
 * All tiers have access to OCR, VisionAgent, SummaryAgent, TalkBackAgent,
 * ResearchAgent (planning mode), and basic missions — these are the core
 * value of ScreenSmart and are never gated.
 */

// ---------------------------------------------------------------------------
// Plan tier
// ---------------------------------------------------------------------------

export type PlanTier = "free_local" | "pro_cloud" | "team" | "enterprise";

// ---------------------------------------------------------------------------
// Feature vocabulary
// ---------------------------------------------------------------------------

export type PlanFeature =
  /** Run AI models via Ollama on the user's own machine */
  | "local_ai"
  /** Use OpenRouter :free-suffix models as cloud fallback */
  | "cloud_free_fallback"
  /** Anthropic/OpenAI/hosted models managed by ScreenSmart */
  | "hosted_cloud_ai"
  /** Mission planning, workflow checkpoints, agent timelines */
  | "mission_control"
  /** ResearchAgent structured output and citation planning */
  | "research_intelligence"
  /** Autonomous browsing agent (future) */
  | "browser_operator"
  /** Sync sessions, notes, and missions across devices */
  | "cloud_sync"
  /** Cross-session memory and learning (future) */
  | "advanced_memory"
  /** Priority routing to premium models (GPT-4o, Claude 3.5) */
  | "priority_models"
  /** Shared workspaces and collaborative missions */
  | "team_workspaces";

// ---------------------------------------------------------------------------
// Plan limits — undefined means no limit
// ---------------------------------------------------------------------------

export type PlanLimits = {
  /** Cloud-hosted AI requests per day (undefined = unlimited) */
  cloudRequestsPerDay?: number;
  /** Saved screen sessions per account */
  savedSessions?: number;
  /** Active missions at one time */
  missions?: number;
  /** Team members in a workspace */
  teamMembers?: number;
  /** Research results stored */
  researchResults?: number;
};

// ---------------------------------------------------------------------------
// Plan definition
// ---------------------------------------------------------------------------

export type UserPlan = {
  tier: PlanTier;
  name: string;
  tagline: string;
  description: string;
  features: PlanFeature[];
  limits: PlanLimits;
  /** undefined = free forever */
  priceMonthlyUsd?: number;
  /** CTA label for upgrade buttons */
  upgradeLabel: string;
  /** true = this tier is purchasable now (false = coming soon) */
  available: boolean;
};

// ---------------------------------------------------------------------------
// Upgrade context — returned by AccessControl.getUpgradeReason()
// ---------------------------------------------------------------------------

export type UpgradeContext = {
  feature: PlanFeature;
  currentTier: PlanTier;
  requiredTier: PlanTier;
  /** Short headline shown in FeatureGate */
  headline: string;
  /** 1–2 sentence benefit description */
  benefit: string;
  /** The plan the user should upgrade to */
  suggestedPlan: UserPlan;
};

// ---------------------------------------------------------------------------
// Feature metadata — for display in upgrade UI
// ---------------------------------------------------------------------------

export type PlanFeatureMeta = {
  feature: PlanFeature;
  label: string;
  description: string;
  emoji: string;
};

export const PLAN_FEATURE_META: Record<PlanFeature, PlanFeatureMeta> = {
  local_ai: {
    feature: "local_ai",
    label: "Local AI",
    description: "Run AI models privately on your own machine via Ollama. No cloud required.",
    emoji: "🏠"
  },
  cloud_free_fallback: {
    feature: "cloud_free_fallback",
    label: "Free Cloud Fallback",
    description: "Automatically fall back to OpenRouter free models when local AI isn't available.",
    emoji: "☁️"
  },
  hosted_cloud_ai: {
    feature: "hosted_cloud_ai",
    label: "Hosted Cloud AI",
    description: "Premium AI models (GPT-4o, Claude) hosted and managed by ScreenSmart.",
    emoji: "⚡"
  },
  mission_control: {
    feature: "mission_control",
    label: "Mission Control",
    description: "AI-powered workflow planning with checkpoints, timelines, and agent coordination.",
    emoji: "🎯"
  },
  research_intelligence: {
    feature: "research_intelligence",
    label: "Research Intelligence",
    description: "Structured research planning with citations, search queries, and evidence gaps.",
    emoji: "🔬"
  },
  browser_operator: {
    feature: "browser_operator",
    label: "Browser Operator",
    description: "Autonomous browser agent that reads, navigates, and summarises web content for you.",
    emoji: "🌐"
  },
  cloud_sync: {
    feature: "cloud_sync",
    label: "Cloud Sync",
    description: "Sync sessions, notes, and missions across all your devices in real time.",
    emoji: "🔄"
  },
  advanced_memory: {
    feature: "advanced_memory",
    label: "Advanced Memory",
    description: "Cross-session memory that learns your context and surfaces relevant history.",
    emoji: "🧠"
  },
  priority_models: {
    feature: "priority_models",
    label: "Priority Models",
    description: "Priority routing to the fastest and most capable AI models available.",
    emoji: "🚀"
  },
  team_workspaces: {
    feature: "team_workspaces",
    label: "Team Workspaces",
    description: "Shared workspaces, collaborative missions, and team memory for organisations.",
    emoji: "👥"
  }
};
