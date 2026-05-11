import { placeholderAiService } from "@/services/ai";
import type { AiResponse } from "@/services/ai";
import type { ChatMessage } from "@/types/chat";
import type { ScreenSession } from "@/types/screenSession";
import type { AgentDefinition } from "./types";

export type ScreenCompanionAgent = {
  definition: AgentDefinition;
  summarizeCurrentScreen: (session: ScreenSession) => Promise<AiResponse>;
  explainCurrentScreen: (session: ScreenSession) => Promise<AiResponse>;
  answerScreenQuestion: (input: {
    question: string;
    session: ScreenSession;
    history: ChatMessage[];
  }) => Promise<ChatMessage>;
};

export const screenCompanionAgent: ScreenCompanionAgent = {
  definition: {
    id: "screen-companion",
    label: "Screen Companion",
    description: "MVP agent boundary for OCR-grounded screen assistance.",
    requiredCapabilities: ["aiDiscussion", "ocrExtraction", "screenshotUpload"]
  },
  summarizeCurrentScreen: placeholderAiService.summarize,
  explainCurrentScreen: placeholderAiService.explain,
  answerScreenQuestion: placeholderAiService.answerQuestion
};
