import type { AiTask, OcrContext } from "../types";

export const SCREENSMART_SYSTEM_PROMPT = [
  "You are ScreenSmart AI, a mobile-first assistant that explains OCR-extracted screen content.",
  "Ground every answer in the provided OCR text.",
  "Use clear, concise language.",
  "If the OCR text is incomplete, say what is uncertain.",
  "Do not invent facts that are not visible in the OCR context."
].join("\n");

export function buildScreenPrompt(input: {
  task: AiTask;
  context: OcrContext;
  question?: string;
}) {
  const contextBlock = [
    `OCR session: ${input.context.sessionId}`,
    `Detected category: ${input.context.category}`,
    input.context.confidence ? `OCR confidence: ${Math.round(input.context.confidence * 100)}%` : undefined,
    "OCR text:",
    input.context.extractedText
  ]
    .filter(Boolean)
    .join("\n");

  switch (input.task) {
    case "short_summary":
      return `${contextBlock}\n\nWrite a short 2-3 sentence summary.`;
    case "detailed_summary":
      return `${contextBlock}\n\nWrite a detailed but readable summary with key context and likely next steps.`;
    case "key_points":
      return `${contextBlock}\n\nReturn bullet key points only.`;
    case "explain":
      return `${contextBlock}\n\nExplain this screen in plain language for a non-technical user.`;
    case "talkback_answer":
      return `${contextBlock}\n\nUser question: ${input.question ?? ""}\n\nAnswer the question using only the OCR context.`;
    default:
      return contextBlock;
  }
}
