import type { ChatMessage, ScanResult } from "../types/content";

export const aiService = {
  async summarizeScreen(extractedText: string): Promise<Pick<ScanResult, "summary" | "suggestedActions" | "insights">> {
    return {
      summary: `Mock AI summary for: ${extractedText}`,
      suggestedActions: [
        "Confirm the most important details.",
        "Ask ScreenSmart a follow-up question.",
        "Save the scan to your library."
      ],
      insights: [
        {
          id: "mock-priority",
          label: "Priority",
          body: "Placeholder AI processing will later classify urgency and context."
        }
      ]
    };
  },

  async answerQuestion(question: string, history: ChatMessage[]): Promise<ChatMessage> {
    const priorContext = history.length > 0 ? " using the current conversation context" : "";

    return {
      id: `assistant-${Date.now()}`,
      author: "assistant",
      body: `Mock answer${priorContext}: ScreenSmart will explain "${question}" in plain language.`
    };
  }
};
