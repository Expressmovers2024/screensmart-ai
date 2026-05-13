/**
 * ResearchResult
 *
 * Structured output from ResearchAgent. When web search is unavailable
 * (the current MVP state), the agent generates a "research planning mode"
 * output that tells the user exactly what to search, what sources to check,
 * and what questions need answering — without making any external requests.
 *
 * When a live web search tool is connected in a future phase, the same type
 * is populated with real citations and confirmed snippets.
 */
export type ResearchCitation = {
  title: string;
  url: string;
  snippet: string;
  /** true = real crawled result; false = AI-planned search target */
  isPlanned: boolean;
};

export type ResearchMode = "planning" | "live";

export type ResearchResult = {
  id: string;
  sessionId: string;
  /** The resolved question or topic that drove this research pass */
  query: string;
  /** Plain-language summary of findings or research plan */
  summary: string;
  /** 2–5 concrete sources to check (planned) or confirmed citations (live) */
  citations: ResearchCitation[];
  /** 3–6 topically adjacent subjects worth exploring */
  relatedTopics: string[];
  /** Actionable follow-up questions surfaced as buttons in the UI */
  suggestedFollowUps: string[];
  /** 0.0–1.0 — how confident the agent is in its analysis */
  confidence: number;
  /** ISO timestamp */
  createdAt: string;
  /** Indicates whether real web results were available */
  mode: ResearchMode;
  /** The AI-generated search queries that were (or would be) issued */
  searchQueries: string[];
  /** Category detected from screen intelligence */
  screenCategory?: string;
  /** Evidence gaps the user should close before acting on this screen */
  evidenceGaps: string[];
};
