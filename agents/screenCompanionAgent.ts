import { placeholderAiService } from "@/services/ai";
import type { AiResponse } from "@/services/ai";
import type { ChatMessage } from "@/types/chat";
import type { ScreenSession } from "@/types/screenSession";

export type ScreenCompanionAgent = {
  summarizeCurrentScreen: (session: ScreenSession) => Promise<AiResponse>;
  explainCurrentScreen: (session: ScreenSession) => Promise<AiResponse>;
  answerScreenQuestion: (input: {
    question: string;
    session: ScreenSession;
    history: ChatMessage[];
  }) => Promise<ChatMessage>;
};

export const screenCompanionAgent: ScreenCompanionAgent = {
  summarizeCurrentScreen: placeholderAiService.summarize,
  explainCurrentScreen: placeholderAiService.explain,
  answerScreenQuestion: placeholderAiService.answerQuestion
};
