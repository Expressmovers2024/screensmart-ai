import type { AiService } from "./types";
import { createId } from "@/utils/createId";

export const placeholderAiService: AiService = {
  async summarize(session) {
    return `Placeholder summary for session ${session.id}. Production AI summarization will be connected here.`;
  },

  async explain(session) {
    return `Placeholder explanation based on OCR text: ${session.ocr?.extractedText ?? "No OCR text available yet."}`;
  },

  async answerQuestion({ question, session }) {
    return {
      id: createId("assistant-message"),
      role: "assistant",
      body: `Placeholder AI answer grounded in session ${session.id}: "${question}"`,
      createdAt: new Date().toISOString()
    };
  }
};
