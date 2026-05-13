/**
 * ResearchAgent — capability-based, vendor-agnostic.
 *
 * Requests: research_planning, low_cost
 * ProviderRouter selects: Ollama → OpenRouter → Mock
 *
 * Safety: no autonomous browsing, no form submission,
 * no credential logging, no purchases.
 */

import { createOcrContext } from "@/services/ai/aiChatService";
import { providerRouter } from "@/src/providers";
import type { ResearchCitation, ResearchResult } from "@/types/research";
import { createId } from "@/utils/createId";

import { BaseAgent } from "../core/BaseAgent";
import type { AgentContext, ScreenIntelligenceOutput } from "../core/AgentTypes";

export type ResearchAgentInput = {
  sessionId: string;
  extractedText: string;
  intelligence?: ScreenIntelligenceOutput;
  userQuestion?: string;
};

export class ResearchAgent extends BaseAgent<ResearchAgentInput, ResearchResult> {
  constructor() {
    super({
      id: "research.research",
      name: "ResearchAgent",
      department: "research",
      role: "Generate structured research context from screen intelligence",
      description:
        "Requests research_planning + low_cost capabilities. " +
        "ProviderRouter selects: Ollama → OpenRouter → Mock."
    });
  }

  async run(
    input: ResearchAgentInput,
    context: AgentContext
  ): Promise<ResearchResult> {
    const extractedText =
      context.ocr?.extractedText ?? input.extractedText ?? "";
    const intelligence = context.screenIntelligence ?? input.intelligence;
    const userQuestion =
      context.question ?? input.userQuestion ?? deriveQuestion(intelligence, extractedText);

    const ocrContext = createOcrContext({
      extractedText: extractedText.slice(0, 3000),
      sessionId: input.sessionId
    });

    const prompt = buildResearchPrompt(extractedText, intelligence, userQuestion);

    try {
      const response = await providerRouter.route({
        requiredCapabilities: ["research_planning", "low_cost"],
        preferredCostTier: "free",
        prompt,
        context: ocrContext
      });

      const parsed = parseJson(response.content);
      if (parsed) return hydrateResult(parsed, input.sessionId, userQuestion);
    } catch {
      // fall through to planning fallback
    }

    return buildPlanningFallback(input.sessionId, extractedText, intelligence, userQuestion);
  }

  protected safeFallback(
    input: ResearchAgentInput,
    context: AgentContext
  ): ResearchResult {
    return buildPlanningFallback(
      input.sessionId,
      context.ocr?.extractedText ?? input.extractedText ?? "",
      context.screenIntelligence ?? input.intelligence,
      input.userQuestion ?? "What is shown on this screen?"
    );
  }
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

function buildResearchPrompt(
  text: string,
  intel: ScreenIntelligenceOutput | undefined,
  question: string
): string {
  const lines = [
    "You are a research assistant. Generate a structured research plan.",
    "Return ONLY a JSON object — no markdown, no preamble.",
    "Keys: summary, searchQueries (3–5), citations (2–5 objects with title/url/snippet/isPlanned:true),",
    "  relatedTopics (3–6), suggestedFollowUps (3–5), evidenceGaps (2–4), confidence (0–1).",
    "",
    "Safety: do NOT suggest credential entry, form submission, or purchases.",
    "Only suggest public trustworthy sources.",
    ""
  ];

  if (intel) {
    lines.push(`Screen type: ${intel.screenType}`);
    lines.push(`Detected task: ${intel.detectedTask}`);
    if (intel.keyEntities.length) lines.push(`Entities: ${intel.keyEntities.join(", ")}`);
  }

  lines.push(`User question: ${question}`);
  lines.push(`\nOCR text:\n${text.slice(0, 2000) || "(none)"}`);
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Fallback planning output
// ---------------------------------------------------------------------------

function buildPlanningFallback(
  sessionId: string,
  text: string,
  intel: ScreenIntelligenceOutput | undefined,
  question: string
): ResearchResult {
  const screenType = intel?.screenType ?? "General screen";
  const detectedTask = intel?.detectedTask ?? "Understand this screen";
  const app = intel?.appOrWebsite ?? "Unknown app";
  const entities = intel?.keyEntities ?? extractEntities(text);

  return {
    id: createId("research"),
    sessionId,
    query: question,
    summary: `Research plan for: "${question}". Screen identified as ${screenType}. Use the search queries below before acting on: "${detectedTask}".`,
    citations: buildCitations(app, entities, screenType),
    relatedTopics: [screenType, ...entities.slice(0, 3), "Digital safety", "How to verify online"].slice(0, 6),
    suggestedFollowUps: [
      `Is this ${screenType.toLowerCase()} legitimate?`,
      `What should I know before: ${detectedTask}?`,
      "What are the risks on this screen?",
      "Are there safer alternatives?",
      `What do experts say about: ${question.slice(0, 40)}?`
    ],
    confidence: 0.55,
    createdAt: new Date().toISOString(),
    mode: "planning",
    searchQueries: [
      question.slice(0, 80),
      `${screenType} ${app} explained`,
      `how to ${detectedTask.toLowerCase()}`,
      entities[0] ? `what is ${entities[0]}` : `${app} safety tips`
    ].slice(0, 5),
    screenCategory: screenType,
    evidenceGaps: [
      `No external verification of ${screenType.toLowerCase()} claims`,
      entities[0] ? `No official source found for: ${entities[0]}` : "Source URL not verified",
      "Domain trustworthiness not confirmed"
    ]
  };
}

function buildCitations(
  app: string,
  entities: string[],
  screenType: string
): ResearchCitation[] {
  const c: ResearchCitation[] = [
    {
      title: `Wikipedia — ${app}`,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(app.replace(/\s+/g, "_"))}`,
      snippet: `Background information about ${app}.`,
      isPlanned: true
    }
  ];

  if (screenType.toLowerCase().includes("financial")) {
    c.push({
      title: "Consumer Financial Protection Bureau",
      url: "https://www.consumerfinance.gov",
      snippet: "Official US guidance on financial consumer rights.",
      isPlanned: true
    });
  }

  if (entities[0]) {
    c.push({
      title: `Official documentation for: ${entities[0]}`,
      url: `https://www.google.com/search?q=${encodeURIComponent(entities[0])}+official`,
      snippet: `Search for authoritative information about: ${entities[0]}.`,
      isPlanned: true
    });
  }

  return c.slice(0, 4);
}

// ---------------------------------------------------------------------------
// JSON parsing + hydration
// ---------------------------------------------------------------------------

function parseJson(content: string): Partial<ResearchResult> | null {
  const clean = content.replace(/```json|```/g, "").trim();
  try { return JSON.parse(clean) as Partial<ResearchResult>; } catch { /* fall through */ }
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]) as Partial<ResearchResult>; } catch { return null; }
}

function hydrateResult(
  p: Partial<ResearchResult>,
  sessionId: string,
  query: string
): ResearchResult {
  return {
    id: createId("research"),
    sessionId,
    query,
    summary: typeof p.summary === "string" ? p.summary : "Research plan generated.",
    citations: normaliseCitations(p.citations),
    relatedTopics: normaliseArr(p.relatedTopics),
    suggestedFollowUps: normaliseArr(p.suggestedFollowUps),
    confidence: typeof p.confidence === "number" ? Math.max(0, Math.min(1, p.confidence)) : 0.65,
    createdAt: new Date().toISOString(),
    mode: "planning",
    searchQueries: normaliseArr(p.searchQueries).length > 0 ? normaliseArr(p.searchQueries) : [query],
    evidenceGaps: normaliseArr(p.evidenceGaps),
    screenCategory: typeof p.screenCategory === "string" ? p.screenCategory : undefined
  };
}

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------

function deriveQuestion(intel: ScreenIntelligenceOutput | undefined, text: string): string {
  if (intel?.userIntentGuess) return intel.userIntentGuess;
  if (intel?.detectedTask) return `What do I need to know about: ${intel.detectedTask}?`;
  const first = text.split("\n").find((l) => l.trim().length > 8);
  return first ? `What is this about: ${first.trim().slice(0, 60)}?` : "What is on this screen?";
}

function extractEntities(text: string): string[] {
  return Array.from(new Set(text.match(/\b[A-Z][A-Za-z0-9&.-]{2,}\b/g) ?? [])).slice(0, 5);
}

function normaliseCitations(v: unknown): ResearchCitation[] {
  if (!Array.isArray(v)) return [];
  return (v as unknown[])
    .filter((c): c is Record<string, unknown> => c !== null && typeof c === "object")
    .filter((c) => typeof c.title === "string" && typeof c.url === "string")
    .map((c) => ({
      title: c.title as string,
      url: c.url as string,
      snippet: typeof c.snippet === "string" ? c.snippet : "",
      isPlanned: (c.isPlanned as boolean | undefined) ?? true
    }))
    .slice(0, 5);
}

function normaliseArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return (v as unknown[]).filter((i): i is string => typeof i === "string" && i.trim().length > 0).slice(0, 8);
}
