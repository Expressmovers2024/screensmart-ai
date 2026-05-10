import type { ChatMessage } from "@/types/chat";
import type { ScreenSession } from "@/types/screenSession";

export type OcrContextCategory = "financial" | "article" | "instructions" | "chart_or_table" | "general";

export type OcrContext = {
  sessionId: string;
  extractedText: string;
  confidence?: number;
  category: OcrContextCategory;
};

export type AiChatRequest = {
  question: string;
  context: OcrContext;
  history: ChatMessage[];
};

export type AiChatResponse = {
  message: ChatMessage;
  contextCategory: OcrContextCategory;
  referencedText: string;
};

export type AiService = {
  summarize: (session: ScreenSession) => Promise<string>;
  explain: (session: ScreenSession) => Promise<string>;
  answerQuestion: (input: {
    question: string;
    session: ScreenSession;
    history: ChatMessage[];
  }) => Promise<ChatMessage>;
};
