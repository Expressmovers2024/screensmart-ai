export type ScreenSessionContext = {
  screenTitle: string;
  extractedText: string;
  summary: string;
  confidence?: string;
};

export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  body: string;
};

export type MockAiChatRequest = {
  question: string;
  context: ScreenSessionContext;
  history: ChatMessage[];
};
