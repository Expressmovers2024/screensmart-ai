import { BaseAgent } from "../core/BaseAgent";
import type { AgentContext, ScreenIntelligenceOutput } from "../core/AgentTypes";
import { getModelRouteForTask } from "@/services/ai/routing/modelRouter";
import type { UploadedScreenshot } from "@/services/ocr";

type VisionAgentInput = {
  extractedText: string;
  confidence?: number;
  image?: UploadedScreenshot;
};

type VisionProxyResponse = {
  content?: string;
  model?: string;
};

export class VisionAgent extends BaseAgent<VisionAgentInput, ScreenIntelligenceOutput> {
  constructor() {
    super({
      id: "screensmart.vision",
      name: "VisionAgent",
      department: "screensmart",
      role: "Classify screen intent and entities",
      description: "Builds Screen Intelligence from OCR text using deterministic mobile-safe heuristics."
    });
  }

  async run(input: VisionAgentInput): Promise<ScreenIntelligenceOutput> {
    const visualOutput = await tryVisionProxy(input);

    if (visualOutput) {
      return visualOutput;
    }

    return buildOcrOnlyIntelligence(input, true);
  }

  protected safeFallback(input: VisionAgentInput, context: AgentContext): ScreenIntelligenceOutput {
    return {
      ...buildOcrOnlyIntelligence(
        {
          confidence: 0.2,
          extractedText: context.ocr?.extractedText ?? input.extractedText
        },
        true
      ),
      reasoningSummary: "Fallback intelligence used because visual analysis could not classify this screen."
    };
  }
}

async function tryVisionProxy(input: VisionAgentInput): Promise<ScreenIntelligenceOutput | null> {
  const proxyUrl = process.env.EXPO_PUBLIC_AI_PROXY_URL || process.env.EXPO_PUBLIC_OPENROUTER_PROXY_URL;
  const base64 = input.image?.base64;

  if (!proxyUrl || !base64) {
    return null;
  }

  const modelRoute = getModelRouteForTask("openrouter", "vision_analysis");
  const response = await fetch(proxyUrl, {
    body: JSON.stringify({
      context: {
        confidence: input.confidence,
        extractedText: input.extractedText
      },
      fallbackModels: modelRoute.fallbacks,
      image: {
        base64,
        mimeType: input.image?.mimeType ?? "image/jpeg"
      },
      model: modelRoute.primary,
      preferredModel: modelRoute.primary,
      prompt: buildVisionPrompt(input.extractedText),
      provider: "openrouter",
      task: "vision_analysis",
      temperature: 0.1
    }),
    headers: {
      "Content-Type": "application/json",
      "X-ScreenSmart-App": "mobile-mvp"
    },
    method: "POST"
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as VisionProxyResponse;
  const parsed = parseVisionJson(data.content);

  if (!parsed) {
    return null;
  }

  const fallback = buildOcrOnlyIntelligence(input, false);

  return {
    appOrWebsite: parsed.appOrWebsite || fallback.appOrWebsite,
    confidence: normalizeConfidence(parsed.confidence, input.confidence ?? 0.65),
    detectedTask: parsed.detectedTask || fallback.detectedTask,
    fallbackUsed: false,
    importantNumbers: fallback.importantNumbers,
    importantVisualElements: normalizeStringArray(parsed.importantVisualElements, fallback.importantVisualElements),
    keyEntities: normalizeStringArray(parsed.keyEntities, fallback.keyEntities),
    layoutDescription: parsed.layoutDescription || fallback.layoutDescription,
    reasoningSummary: parsed.reasoningSummary || "Vision model analyzed the screenshot layout, visible UI elements, and OCR context.",
    screenType: parsed.screenType || fallback.screenType,
    suggestedActions: normalizeStringArray(parsed.suggestedActions, fallback.suggestedActions),
    summary: parsed.visualSummary || fallback.summary,
    userIntentGuess: parsed.userIntentGuess || fallback.userIntentGuess,
    visibleProblems: normalizeStringArray(parsed.visibleProblems, fallback.visibleProblems),
    visualSummary: parsed.visualSummary || fallback.visualSummary
  };
}

function buildOcrOnlyIntelligence(input: VisionAgentInput, fallbackUsed: boolean): ScreenIntelligenceOutput {
    const text = input.extractedText.trim();
    const normalized = text.toLowerCase();
    const screenType = detectScreenType(normalized);
    const appOrWebsite = detectAppOrWebsite(text, normalized);
    const detectedTask = detectTask(normalized, screenType);
    const keyEntities = extractEntities(text);
    const visibleProblems = detectVisibleProblems(normalized);
    const importantNumbers = extractImportantNumbers(text);

  const summary = text ? text.split(/\n+/).slice(0, 2).join(" ").slice(0, 220) : "No readable OCR text was found.";

  return {
    appOrWebsite,
    confidence: input.confidence ?? 0.5,
    detectedTask,
    fallbackUsed,
    importantNumbers,
    importantVisualElements: inferVisualElements(normalized),
    keyEntities,
    layoutDescription: inferLayoutDescription(normalized, text),
    reasoningSummary: buildReasoningSummary(screenType, detectedTask, visibleProblems, fallbackUsed),
    screenType,
    suggestedActions: getSuggestedActions(screenType, detectedTask, visibleProblems),
    summary,
    userIntentGuess: guessUserIntent(normalized, detectedTask),
    visibleProblems,
    visualSummary: fallbackUsed
      ? `OCR-only fallback analysis: ${summary}`
      : summary
  };
}

function buildVisionPrompt(extractedText: string) {
  return [
    "Analyze this mobile screenshot visually and return only strict JSON.",
    "Use the image first, then OCR text as supporting context.",
    "Do not invent facts not visible in the screenshot.",
    "JSON keys: screenType, appOrWebsite, visualSummary, layoutDescription, detectedTask, userIntentGuess, keyEntities, visibleProblems, importantVisualElements, suggestedActions, confidence, reasoningSummary.",
    "Keep arrays short and user-facing.",
    `OCR text:\n${extractedText || "No OCR text available."}`
  ].join("\n\n");
}

function parseVisionJson(content?: string) {
  if (!content) {
    return null;
  }

  const jsonText = content.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(jsonText) as Partial<ScreenIntelligenceOutput>;
  } catch {
    const match = jsonText.match(/\{[\s\S]*\}/);

    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]) as Partial<ScreenIntelligenceOutput>;
    } catch {
      return null;
    }
  }
}

function detectAppOrWebsite(text: string, normalized: string) {
  const knownMatches: Array<[RegExp, string]> = [
    [/gmail|inbox|compose|email/, "Email app"],
    [/safari|chrome|browser|http|www\./, "Web browser"],
    [/bank|cash app|paypal|venmo|stripe/, "Finance app or website"],
    [/slack|teams|discord|message/, "Messaging app"],
    [/amazon|shop|cart|checkout|order/, "Shopping app or website"],
    [/settings|preferences|permission/, "System settings"]
  ];

  const match = knownMatches.find(([pattern]) => pattern.test(normalized));

  if (match) {
    return match[1];
  }

  const titleCandidate = text.split(/\n+/).find((line) => line.trim().length > 2 && line.trim().length < 40);
  return titleCandidate?.trim() ?? "Unknown app or website";
}

function detectScreenType(text: string) {
  if (/\$|balance|invoice|payment|bank|fee|transaction|amount|due/.test(text)) {
    return "Financial screen";
  }

  if (/error|warning|failed|blocked|permission|security|risk/.test(text)) {
    return "Alert or warning";
  }

  if (/article|headline|newsletter|read more|published|author/.test(text)) {
    return "Reading screen";
  }

  if (/step|install|setup|tap|click|select|next|guide|instructions/.test(text)) {
    return "Instruction screen";
  }

  if (/chart|table|row|column|metric|trend|data|percentage/.test(text)) {
    return "Data screen";
  }

  return "General screen";
}

function detectTask(text: string, screenType: string) {
  if (screenType === "Financial screen") {
    return "Review financial details before acting";
  }

  if (screenType === "Alert or warning") {
    return "Understand the warning and choose a safe next step";
  }

  if (/login|sign in|password|account/.test(text)) {
    return "Resolve account or sign-in context";
  }

  if (/checkout|cart|order|subscribe/.test(text)) {
    return "Review a purchase or subscription action";
  }

  return "Understand and summarize the current screen";
}

function getSuggestedActions(screenType: string, detectedTask: string, visibleProblems: string[]) {
  const actions = getDefaultSuggestedActions();

  if (screenType === "Alert or warning") {
    return uniqueActions(["Explain this screen like I’m new", "Ask a follow-up", ...actions]);
  }

  if (detectedTask.toLowerCase().includes("financial") || visibleProblems.length > 0) {
    return uniqueActions(["Explain this screen like I’m new", "Turn this into notes", ...actions]);
  }

  return actions;
}

function getDefaultSuggestedActions() {
  return [
    "Summarize this screen",
    "Explain this screen like I’m new",
    "Turn this into notes",
    "Ask a follow-up",
    "Save to library",
    "Continue this task",
    "Research this topic"
  ];
}

function uniqueActions(actions: string[]) {
  return Array.from(new Set(actions));
}

function guessUserIntent(text: string, detectedTask: string) {
  if (/why|what|how|help|explain/.test(text)) {
    return "Understand confusing screen content";
  }

  if (/checkout|submit|send|delete|confirm|continue/.test(text)) {
    return "Decide whether to take the visible action safely";
  }

  return detectedTask;
}

function detectVisibleProblems(text: string) {
  const problems: string[] = [];

  if (/error|failed|unable|cannot|blocked/.test(text)) {
    problems.push("An error or blocked state is visible.");
  }

  if (/warning|risk|caution|overdue|urgent/.test(text)) {
    problems.push("A warning or urgent state may need attention.");
  }

  if (/password|verification code|one-time code/.test(text)) {
    problems.push("Sensitive credential-like information may be visible.");
  }

  return problems;
}

function extractImportantNumbers(text: string) {
  const currency = text.match(/\$[0-9,.]+/g) ?? [];
  const percentages = text.match(/\b\d+(?:\.\d+)?%/g) ?? [];
  const dates = text.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g) ?? [];

  return Array.from(new Set([...currency, ...percentages, ...dates])).slice(0, 8);
}

function inferVisualElements(text: string) {
  const elements = ["screenshot preview"];

  if (/button|tap|continue|submit|save|send|checkout|next/.test(text)) {
    elements.push("action buttons");
  }

  if (/form|email|password|name|address|input/.test(text)) {
    elements.push("form fields");
  }

  if (/chart|graph|table|row|column|axis/.test(text)) {
    elements.push("chart or table");
  }

  if (/image|photo|avatar|thumbnail|logo/.test(text)) {
    elements.push("images or branding");
  }

  return Array.from(new Set(elements));
}

function inferLayoutDescription(text: string, originalText: string) {
  if (!originalText.trim()) {
    return "No OCR text was available, so layout is inferred from screenshot metadata only.";
  }

  if (/table|row|column|chart|graph/.test(text)) {
    return "The screen appears to use a structured data layout with rows, columns, or chart-like content.";
  }

  if (/form|password|email|submit|continue/.test(text)) {
    return "The screen appears to contain a form or task flow with fields and action controls.";
  }

  if (/article|headline|paragraph|newsletter/.test(text)) {
    return "The screen appears to be a reading layout with text-heavy content.";
  }

  return "The screen appears to be a standard mobile layout with readable text and action areas.";
}

function normalizeStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const strings = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return strings.length > 0 ? strings.slice(0, 8) : fallback;
}

function normalizeConfidence(value: unknown, fallback: number) {
  return typeof value === "number" && !Number.isNaN(value) ? Math.max(0, Math.min(1, value)) : fallback;
}

function buildReasoningSummary(screenType: string, detectedTask: string, visibleProblems: string[], fallbackUsed: boolean) {
  const problemText = visibleProblems.length > 0 ? ` It flagged ${visibleProblems.length} visible issue(s).` : "";
  const mode = fallbackUsed ? "OCR-only fallback" : "visual and OCR";

  return `Classified as ${screenType} using ${mode} analysis. The likely task is: ${detectedTask}.${problemText}`;
}

function extractEntities(text: string) {
  const currency = text.match(/\$[0-9,.]+/g) ?? [];
  const capitalized = text.match(/\b[A-Z][A-Za-z0-9&.-]{2,}\b/g) ?? [];
  const dates = text.match(/\b(?:\d{1,2}\/\d{1,2}\/\d{2,4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[A-Za-z0-9, ]*\b/g) ?? [];

  return Array.from(new Set([...currency, ...dates, ...capitalized])).slice(0, 8);
}
