/**
 * VisionAgent — capability-based, vendor-agnostic.
 *
 * Requests: vision_analysis, low_cost
 * ProviderRouter selects providers with supportsVision = true:
 *   Ollama (llava) → OpenRouter (gemini/qwen-vl) → Mock
 */

import type { UploadedScreenshot } from "@/services/ocr";
import { providerRouter } from "@/src/providers";
import type { ProviderRequest } from "@/src/providers";
import { createOcrContext } from "@/services/ai/aiChatService";

import { BaseAgent } from "../core/BaseAgent";
import type { AgentContext, ScreenIntelligenceOutput } from "../core/AgentTypes";

export type VisionAgentInput = {
  extractedText: string;
  confidence?: number;
  image?: UploadedScreenshot;
};

export class VisionAgent extends BaseAgent<VisionAgentInput, ScreenIntelligenceOutput> {
  constructor() {
    super({
      id: "screensmart.vision",
      name: "VisionAgent",
      department: "screensmart",
      role: "Classify screen intent and entities",
      description:
        "Requests vision_analysis capability. " +
        "ProviderRouter selects vision-capable providers: Ollama (llava) → OpenRouter → Mock."
    });
  }

  async run(
    input: VisionAgentInput,
    context: AgentContext
  ): Promise<ScreenIntelligenceOutput> {
    const extractedText =
      context.ocr?.extractedText ?? input.extractedText ?? "";
    const confidence = context.ocr?.confidence ?? input.confidence;

    const ocrContext = createOcrContext({
      confidence,
      extractedText: extractedText.slice(0, 3000),
      sessionId: context.sessionId
    });

    const prompt = buildVisionPrompt(extractedText);
    const base64 = input.image?.base64;

    const request: ProviderRequest = {
      requiredCapabilities: ["vision_analysis", "low_cost"],
      preferredCostTier: "free",
      prompt,
      context: ocrContext,
      meta: base64
        ? { imageBase64: base64, mimeType: input.image?.mimeType ?? "image/jpeg" }
        : undefined
    };

    try {
      const response = base64
        ? await providerRouter.routeVision({
            ...request,
            imageBase64: base64,
            mimeType: input.image?.mimeType ?? "image/jpeg"
          })
        : await providerRouter.route(request);

      const parsed = parseVisionJson(response.content);
      if (parsed) return hydrateIntelligence(parsed, extractedText, confidence);
    } catch {
      // fall through to OCR-only fallback
    }

    return buildOcrOnlyIntelligence(extractedText, confidence, true);
  }

  protected safeFallback(
    input: VisionAgentInput,
    context: AgentContext
  ): ScreenIntelligenceOutput {
    return {
      ...buildOcrOnlyIntelligence(
        context.ocr?.extractedText ?? input.extractedText,
        0.2,
        true
      ),
      reasoningSummary:
        "Fallback intelligence: visual analysis unavailable, OCR-only classification used."
    };
  }
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

function buildVisionPrompt(extractedText: string): string {
  return [
    "Analyze this mobile screenshot and return ONLY strict JSON.",
    "Keys: screenType, appOrWebsite, visualSummary, layoutDescription, detectedTask,",
    "  userIntentGuess, keyEntities, visibleProblems, importantVisualElements,",
    "  suggestedActions, confidence, reasoningSummary.",
    "Do NOT wrap in markdown fences. Return raw JSON only.",
    "",
    `OCR text:\n${extractedText.slice(0, 2000) || "(none)"}`
  ].join("\n");
}

// ---------------------------------------------------------------------------
// JSON parsing + hydration
// ---------------------------------------------------------------------------

function parseVisionJson(
  content: string
): Partial<ScreenIntelligenceOutput> | null {
  const clean = content.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean) as Partial<ScreenIntelligenceOutput>;
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as Partial<ScreenIntelligenceOutput>;
    } catch {
      return null;
    }
  }
}

function hydrateIntelligence(
  parsed: Partial<ScreenIntelligenceOutput>,
  extractedText: string,
  confidence?: number
): ScreenIntelligenceOutput {
  const fallback = buildOcrOnlyIntelligence(extractedText, confidence, false);
  return {
    appOrWebsite: str(parsed.appOrWebsite, fallback.appOrWebsite),
    confidence: num(parsed.confidence, confidence ?? 0.65),
    detectedTask: str(parsed.detectedTask, fallback.detectedTask),
    fallbackUsed: false,
    importantNumbers: fallback.importantNumbers,
    importantVisualElements: arr(parsed.importantVisualElements, fallback.importantVisualElements),
    keyEntities: arr(parsed.keyEntities, fallback.keyEntities),
    layoutDescription: str(parsed.layoutDescription, fallback.layoutDescription),
    reasoningSummary: str(parsed.reasoningSummary, fallback.reasoningSummary),
    screenType: str(parsed.screenType, fallback.screenType),
    suggestedActions: arr(parsed.suggestedActions, fallback.suggestedActions),
    summary: str(parsed.summary ?? (parsed as Record<string, unknown>).visualSummary as string | undefined, fallback.summary),
    userIntentGuess: str(parsed.userIntentGuess, fallback.userIntentGuess),
    visibleProblems: arr(parsed.visibleProblems, fallback.visibleProblems),
    visualSummary: str((parsed as Record<string, unknown>).visualSummary as string | undefined ?? parsed.summary, fallback.visualSummary)
  };
}

// ---------------------------------------------------------------------------
// OCR-only fallback intelligence builder
// ---------------------------------------------------------------------------

function buildOcrOnlyIntelligence(
  text: string,
  confidence: number | undefined,
  fallbackUsed: boolean
): ScreenIntelligenceOutput {
  const normalized = (text ?? "").toLowerCase();
  const screenType = detectScreenType(normalized);
  const detectedTask = detectTask(normalized, screenType);
  const appOrWebsite = detectApp(text, normalized);
  const summary = (text ?? "").split(/\n+/).slice(0, 2).join(" ").slice(0, 220) ||
    "No readable OCR text.";

  return {
    appOrWebsite,
    confidence: confidence ?? 0.5,
    detectedTask,
    fallbackUsed,
    importantNumbers: extractNumbers(text),
    importantVisualElements: inferVisualElements(normalized),
    keyEntities: extractEntities(text),
    layoutDescription: inferLayout(normalized, text),
    reasoningSummary: `Classified as ${screenType} via OCR-only analysis. Task: ${detectedTask}.`,
    screenType,
    suggestedActions: defaultActions(),
    summary,
    userIntentGuess: detectedTask,
    visibleProblems: detectProblems(normalized),
    visualSummary: fallbackUsed ? `OCR-only: ${summary}` : summary
  };
}

function detectScreenType(t: string) {
  if (/\$|balance|payment|invoice|bank/.test(t)) return "Financial screen";
  if (/error|warning|failed|blocked|permission/.test(t)) return "Alert or warning";
  if (/article|headline|author|published/.test(t)) return "Reading screen";
  if (/step|install|setup|tap|select|guide/.test(t)) return "Instruction screen";
  if (/chart|table|row|column|metric/.test(t)) return "Data screen";
  return "General screen";
}

function detectTask(t: string, screenType: string) {
  if (screenType === "Financial screen") return "Review financial details before acting";
  if (screenType === "Alert or warning") return "Understand the warning and choose a safe next step";
  if (/login|sign in|password/.test(t)) return "Resolve sign-in context";
  if (/checkout|cart|subscribe/.test(t)) return "Review purchase action";
  return "Understand and summarize the current screen";
}

function detectApp(text: string, normalized: string) {
  if (/gmail|inbox|compose/.test(normalized)) return "Email app";
  if (/chrome|safari|browser|http/.test(normalized)) return "Web browser";
  if (/bank|paypal|venmo|cash app/.test(normalized)) return "Finance app";
  if (/slack|teams|discord/.test(normalized)) return "Messaging app";
  if (/amazon|shop|cart|order/.test(normalized)) return "Shopping app";
  return text.split("\n").find((l) => l.trim().length > 2 && l.trim().length < 40)?.trim() ?? "Unknown app";
}

function detectProblems(t: string): string[] {
  const p: string[] = [];
  if (/error|failed|unable|blocked/.test(t)) p.push("An error or blocked state is visible.");
  if (/warning|risk|overdue|urgent/.test(t)) p.push("A warning may need attention.");
  if (/password|otp|verification code/.test(t)) p.push("Sensitive credentials may be visible.");
  return p;
}

function extractNumbers(text: string): string[] {
  return Array.from(new Set([
    ...(text.match(/\$[0-9,.]+/g) ?? []),
    ...(text.match(/\b\d+(?:\.\d+)?%/g) ?? []),
    ...(text.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g) ?? [])
  ])).slice(0, 8);
}

function extractEntities(text: string): string[] {
  return Array.from(new Set(text.match(/\b[A-Z][A-Za-z0-9&.-]{2,}\b/g) ?? [])).slice(0, 8);
}

function inferVisualElements(t: string): string[] {
  const e = ["screenshot preview"];
  if (/button|tap|continue|submit/.test(t)) e.push("action buttons");
  if (/form|email|password|input/.test(t)) e.push("form fields");
  if (/chart|graph|table/.test(t)) e.push("chart or table");
  return e;
}

function inferLayout(t: string, original: string): string {
  if (!original.trim()) return "No OCR text available for layout inference.";
  if (/table|chart|graph/.test(t)) return "Structured data layout.";
  if (/form|password|submit/.test(t)) return "Form or task-flow layout.";
  return "Standard mobile layout with text and action areas.";
}

function defaultActions(): string[] {
  return [
    "Summarize this screen",
    "Explain this screen like I'm new",
    "Turn this into notes",
    "Ask a follow-up",
    "Save to library",
    "Research this screen"
  ];
}

// Type helpers
function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v : fallback;
}
function num(v: unknown, fallback: number): number {
  return typeof v === "number" && !isNaN(v) ? Math.max(0, Math.min(1, v)) : fallback;
}
function arr(v: unknown, fallback: string[]): string[] {
  return Array.isArray(v) && v.length > 0
    ? (v as unknown[]).filter((i): i is string => typeof i === "string").slice(0, 8)
    : fallback;
}
