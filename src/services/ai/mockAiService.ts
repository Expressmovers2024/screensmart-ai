import type { ChatMessage, MockAiChatRequest, ScreenSessionContext } from "./types";

export const defaultScreenSessionContext: ScreenSessionContext = {
  screenTitle: "Current screenshot session",
  extractedText:
    "ScreenSmart AI mock OCR result. Detected screenshot content: account reminder, due date, and next action.",
  summary: "Mock session summary: review the visible details, confirm the deadline, and decide the next action.",
  confidence: "94"
};

export const mockAiService = {
  async answerFromScreenSession({ question, context, history }: MockAiChatRequest): Promise<ChatMessage> {
    const normalizedQuestion = question.toLowerCase();
    const focus = getResponseFocus(normalizedQuestion);
    const previousTurns = history.filter((message) => message.role === "user").length;

    return {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      body: [
        `${focus} I am grounding this answer in ${context.screenTitle}.`,
        `The current extracted text says: "${context.extractedText}"`,
        `Plain-language takeaway: ${context.summary}`,
        context.confidence ? `Mock OCR confidence is ${context.confidence}%.` : undefined,
        previousTurns > 1 ? "I am also using the earlier questions in this chat as context." : undefined
      ]
        .filter(Boolean)
        .join("\n\n")
    };
  }
};

function getResponseFocus(question: string) {
  if (question.includes("next") || question.includes("do")) {
    return "Suggested next step: verify the important details before acting.";
  }

  if (question.includes("summar") || question.includes("mean")) {
    return "Summary: this screen appears to be asking you to review something important.";
  }

  if (question.includes("risk") || question.includes("warning")) {
    return "Potential risk: check deadlines, fees, account details, or confirmation messages.";
  }

  return "Here is a mock ScreenSmart response.";
}
