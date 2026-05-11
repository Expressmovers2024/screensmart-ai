import { BaseAgent } from "../core/BaseAgent";
import type { AgentContext, ScreenIntelligenceOutput } from "../core/AgentTypes";

type VisionAgentInput = {
  extractedText: string;
  confidence?: number;
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
    const text = input.extractedText.trim();
    const normalized = text.toLowerCase();
    const screenType = detectScreenType(normalized);
    const appOrWebsite = detectAppOrWebsite(text, normalized);
    const detectedTask = detectTask(normalized, screenType);
    const keyEntities = extractEntities(text);
    const visibleProblems = detectVisibleProblems(normalized);
    const importantNumbers = extractImportantNumbers(text);

    return {
      appOrWebsite,
      confidence: input.confidence ?? 0.5,
      detectedTask,
      importantNumbers,
      keyEntities,
      reasoningSummary: buildReasoningSummary(screenType, detectedTask, visibleProblems),
      screenType,
      suggestedActions: getSuggestedActions(screenType, detectedTask, visibleProblems),
      userIntentGuess: guessUserIntent(normalized, detectedTask),
      visibleProblems,
      summary: text ? text.split(/\n+/).slice(0, 2).join(" ").slice(0, 220) : "No readable OCR text was found."
    };
  }

  protected safeFallback(_input: VisionAgentInput, context: AgentContext): ScreenIntelligenceOutput {
    return {
      appOrWebsite: "Unknown app or website",
      confidence: 0.2,
      detectedTask: "Review the captured screen",
      importantNumbers: [],
      keyEntities: [],
      reasoningSummary: "Fallback intelligence used because the VisionAgent could not classify this screen.",
      screenType: "General screen",
      suggestedActions: getDefaultSuggestedActions(),
      userIntentGuess: "Understand what is visible and decide what to do next",
      visibleProblems: [],
      summary: context.ocr?.extractedText.slice(0, 180) ?? "Screen intelligence fallback is active."
    };
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

function buildReasoningSummary(screenType: string, detectedTask: string, visibleProblems: string[]) {
  const problemText = visibleProblems.length > 0 ? ` It flagged ${visibleProblems.length} visible issue(s).` : "";

  return `Classified as ${screenType} because the OCR text matched task and content patterns. The likely task is: ${detectedTask}.${problemText}`;
}

function extractEntities(text: string) {
  const currency = text.match(/\$[0-9,.]+/g) ?? [];
  const capitalized = text.match(/\b[A-Z][A-Za-z0-9&.-]{2,}\b/g) ?? [];
  const dates = text.match(/\b(?:\d{1,2}\/\d{1,2}\/\d{2,4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[A-Za-z0-9, ]*\b/g) ?? [];

  return Array.from(new Set([...currency, ...dates, ...capitalized])).slice(0, 8);
}
