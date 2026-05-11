import type { AiService } from "./types";
import { aiService } from "./aiService";

export const placeholderAiService: AiService = {
  getActiveProvider: aiService.getActiveProvider,
  setActiveProvider: aiService.setActiveProvider,
  summarize: aiService.summarize,
  explain: aiService.explain,
  generateKeyPoints: aiService.generateKeyPoints,
  answerQuestion: aiService.answerQuestion
};
