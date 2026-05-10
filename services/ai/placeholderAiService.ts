import type { AiService } from "./types";
import { aiChatService, createOcrContext } from "./aiChatService";

export const placeholderAiService: AiService = {
  async summarize(session) {
    return `Placeholder summary for session ${session.id}. Production AI summarization will be connected here.`;
  },

  async explain(session) {
    return `Placeholder explanation based on OCR text: ${session.ocr?.extractedText ?? "No OCR text available yet."}`;
  },

  async answerQuestion({ question, session, history }) {
    const response = await aiChatService.answerQuestion({
      context: createOcrContext({
        confidence: session.ocr?.confidence,
        extractedText: session.ocr?.extractedText,
        sessionId: session.id
      }),
      history,
      question
    });

    return response.message;
  }
};
