import type { AiService } from "./types";
import { createId } from "@/utils/createId";

export const placeholderAiService: AiService = {
  async summarize(session) {
    return `Placeholder summary for session ${session.id}. Production AI summarization will be connected here.`;
  },

  async explain(session) {
    return `Placeholder explanation based on OCR text: ${session.ocr?.extractedText ?? "No OCR text available yet."}`;
  },

  async answerQuestion({ question, session, history }) {
    const extractedText = session.ocr?.extractedText ?? "No OCR text available yet.";
    const focus = getQuestionFocus(question);
    const previousQuestions = history.filter((message) => message.role === "user").length;

    return {
      id: createId("assistant-message"),
      role: "assistant",
      body: [
        `${focus} This is a mock AI response grounded in your current OCR session.`,
        `Current screen text: ${extractedText}`,
        session.ocr ? `OCR confidence: ${Math.round(session.ocr.confidence * 100)}%.` : undefined,
        previousQuestions > 1 ? "I am also considering the earlier questions in this TalkBack thread." : undefined
      ]
        .filter(Boolean)
        .join("\n\n"),
      createdAt: new Date().toISOString()
    };
  }
};

function getQuestionFocus(question: string) {
  const normalizedQuestion = question.toLowerCase();

  if (normalizedQuestion.includes("mean") || normalizedQuestion.includes("explain")) {
    return "Plain-language explanation:";
  }

  if (normalizedQuestion.includes("next") || normalizedQuestion.includes("do")) {
    return "Suggested next step:";
  }

  if (normalizedQuestion.includes("warning") || normalizedQuestion.includes("risk")) {
    return "Potential warning:";
  }

  if (normalizedQuestion.includes("summary") || normalizedQuestion.includes("summarize")) {
    return "Quick summary:";
  }

  return "ScreenSmart answer:";
}
