import type { ChatMessage } from "@/types/chat";
import { createId } from "@/utils/createId";

import type { AiChatRequest, AiChatResponse, OcrContext, OcrContextCategory } from "./types";

export function createOcrContext(input: {
  sessionId: string;
  extractedText?: string;
  confidence?: number;
}): OcrContext {
  const extractedText = input.extractedText?.trim() || "No OCR text is available for this session yet.";

  return {
    category: detectOcrContextCategory(extractedText),
    confidence: input.confidence,
    extractedText,
    sessionId: input.sessionId
  };
}

export const aiChatService = {
  async answerQuestion({ question, context, history }: AiChatRequest): Promise<AiChatResponse> {
    const referencedText = context.extractedText.slice(0, 420);
    const aiResponse: AiResponse = {
      id: createId("assistant-message"),
      content: buildContextualResponse({
        category: context.category,
        history,
        question,
        referencedText,
        confidence: context.confidence
      }),
      createdAt: new Date().toISOString(),
      fallbackUsed: true,
      finishReason: "stop",
      format: "markdown",
      model: "screensmart-mock-model",
      provider: "placeholder",
      streamed: false,
      task: "talkback_answer",
      usage: {
        estimated: true,
        promptTokens: Math.ceil(context.extractedText.length / 4),
        completionTokens: 120,
        totalTokens: Math.ceil(context.extractedText.length / 4) + 120
      }
    };
    const message: ChatMessage = {
      id: aiResponse.id,
      role: "assistant",
      body: aiResponse.content,
      contextSessionId: context.sessionId,
      createdAt: aiResponse.createdAt
    };

    return {
      aiResponse,
      contextCategory: context.category,
      message,
      referencedText
    };
  }
};

function detectOcrContextCategory(text: string): OcrContextCategory {
  const normalizedText = text.toLowerCase();

  if (/\$|balance|invoice|payment|transfer|bank|fee|total|amount|transaction|due/.test(normalizedText)) {
    return "financial";
  }

  if (/article|headline|author|published|paragraph|story|newsletter|read more/.test(normalizedText)) {
    return "article";
  }

  if (/step|instructions|install|setup|tap|click|select|first|next|finally|guide/.test(normalizedText)) {
    return "instructions";
  }

  if (/chart|table|row|column|axis|graph|percentage|trend|metric|data/.test(normalizedText)) {
    return "chart_or_table";
  }

  return "general";
}

function buildContextualResponse(input: {
  category: OcrContextCategory;
  question: string;
  history: ChatMessage[];
  referencedText: string;
  confidence?: number;
}) {
  const focus = getQuestionFocus(input.question);
  const contextIntro = getCategoryResponse(input.category);
  const followUpNote =
    input.history.filter((message) => message.role === "user").length > 1
      ? "\n\nI am treating this as a follow-up and keeping the earlier questions in mind."
      : "";
  const confidence = input.confidence ? `\n\nOCR confidence: ${Math.round(input.confidence * 100)}%.` : "";

  return [
    `${focus} ${contextIntro}`,
    `I am grounding this in the current OCR text:\n"${input.referencedText}"`,
    "Because this is a mock AI layer, treat this as a product-quality placeholder response until real AI is connected."
  ].join("\n\n") + confidence + followUpNote;
}

function getCategoryResponse(category: OcrContextCategory) {
  switch (category) {
    case "financial":
      return "This screen appears to include financial information. Review amounts, balances, fees, dates, and account context before acting.";
    case "article":
      return "This looks like article or reading content. I can summarize the main point, identify claims, or simplify sections.";
    case "instructions":
      return "This screen appears to contain instructions. I can break the steps down into a simpler sequence.";
    case "chart_or_table":
      return "This appears to include chart, table, or structured data. I can describe the visible trend, rows, columns, or key metrics.";
    case "general":
    default:
      return "I can explain the visible screen text, highlight important details, and suggest a next step.";
  }
}

function getQuestionFocus(question: string) {
  const normalizedQuestion = question.toLowerCase();

  if (normalizedQuestion.includes("summar")) {
    return "Summary:";
  }

  if (normalizedQuestion.includes("mean") || normalizedQuestion.includes("explain")) {
    return "Explanation:";
  }

  if (normalizedQuestion.includes("next") || normalizedQuestion.includes("do")) {
    return "Next step:";
  }

  if (normalizedQuestion.includes("risk") || normalizedQuestion.includes("warning")) {
    return "Risk check:";
  }

  return "Answer:";
}
