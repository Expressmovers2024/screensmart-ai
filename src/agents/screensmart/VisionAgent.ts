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
    const detectedTask = detectTask(normalized, screenType);
    const keyEntities = extractEntities(text);

    return {
      confidence: input.confidence ?? 0.5,
      detectedTask,
      keyEntities,
      screenType,
      suggestedActions: getSuggestedActions(screenType, detectedTask),
      summary: text ? text.split(/\n+/).slice(0, 2).join(" ").slice(0, 220) : "No readable OCR text was found."
    };
  }

  protected safeFallback(_input: VisionAgentInput, context: AgentContext): ScreenIntelligenceOutput {
    return {
      confidence: 0.2,
      detectedTask: "Review the captured screen",
      keyEntities: [],
      screenType: "General screen",
      suggestedActions: ["Generate summary", "Ask TalkBack", "Save session"],
      summary: context.ocr?.extractedText.slice(0, 180) ?? "Screen intelligence fallback is active."
    };
  }
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

function getSuggestedActions(screenType: string, detectedTask: string) {
  const actions = ["Generate summary", "Ask TalkBack", "Save session"];

  if (screenType === "Alert or warning") {
    return ["Explain warning", "Check risks", ...actions];
  }

  if (detectedTask.includes("financial")) {
    return ["Extract amounts", "Check risks", ...actions];
  }

  return actions;
}

function extractEntities(text: string) {
  const currency = text.match(/\$[0-9,.]+/g) ?? [];
  const capitalized = text.match(/\b[A-Z][A-Za-z0-9&.-]{2,}\b/g) ?? [];
  const dates = text.match(/\b(?:\d{1,2}\/\d{1,2}\/\d{2,4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[A-Za-z0-9, ]*\b/g) ?? [];

  return Array.from(new Set([...currency, ...dates, ...capitalized])).slice(0, 8);
}
