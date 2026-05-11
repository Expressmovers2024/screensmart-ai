import { aiService } from "@/services/ai";
import type { ChatMessage } from "@/types/chat";
import type { ScreenSession } from "@/types/screenSession";
import { createId } from "@/utils/createId";

import { BaseAgent } from "../core/BaseAgent";

type TalkBackAgentInput = {
  session: ScreenSession;
  question?: string;
  history?: ChatMessage[];
};

export class TalkBackAgent extends BaseAgent<TalkBackAgentInput, ChatMessage> {
  constructor() {
    super({
      id: "screensmart.talkback",
      name: "TalkBackAgent",
      department: "screensmart",
      role: "Answer OCR-grounded follow-up questions",
      description: "Routes follow-up questions through the existing AI service and safe fallback path."
    });
  }

  run(input: TalkBackAgentInput) {
    return aiService.answerQuestion({
      history: input.history ?? [],
      question: input.question ?? "Suggest the next useful question for this screen.",
      session: input.session
    });
  }

  protected safeFallback(input: TalkBackAgentInput): ChatMessage {
    return {
      id: createId("assistant-message"),
      body: "I am ready to answer follow-up questions about this screen. Ask what it means, what to do next, or whether anything looks risky.",
      contextSessionId: input.session.id,
      createdAt: new Date().toISOString(),
      role: "assistant"
    };
  }
}
