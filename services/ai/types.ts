import type { ChatMessage } from "@/types/chat";
import type { ScreenSession } from "@/types/screenSession";

export type AiService = {
  summarize: (session: ScreenSession) => Promise<string>;
  explain: (session: ScreenSession) => Promise<string>;
  answerQuestion: (input: {
    question: string;
    session: ScreenSession;
    history: ChatMessage[];
  }) => Promise<ChatMessage>;
};
