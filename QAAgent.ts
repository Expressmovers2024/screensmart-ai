/**
 * TalkBackAgent — capability-based, vendor-agnostic.
 *
 * Requests: chat, fast_response, low_cost
 * ProviderRouter selects: Ollama → OpenRouter → Mock
 */

import { createOcrContext } from "@/services/ai/aiChatService";
import { buildScreenPrompt } from "@/services/ai/prompts/screenPrompts";
import { getSafeAiContext } from "@/services/ai/utils/chunkText";
import { providerRouter } from "@/src/providers";
import type { ChatMessage } from "@/types/chat";
import type { ScreenSession } from "@/types/screenSession";
import { createId } from "@/utils/createId";

import { BaseAgent } from "../core/BaseAgent";
import type { AgentContext } from "../core/AgentTypes";

export type TalkBackAgentInput = {
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
      description:
        "Requests chat + fast_response capabilities. " +
        "ProviderRouter selects: Ollama → OpenRouter → Mock."
    });
  }

  async run(input: TalkBackAgentInput, context: AgentContext): Promise<ChatMessage> {
    const rawText =
      context.ocr?.extractedText ??
      input.session.ocr?.extractedText ??
      "No OCR text available.";

    const safe = getSafeAiContext(rawText);
    const ocrContext = createOcrContext({
      confidence: input.session.ocr?.confidence,
      extractedText: safe.wasTruncated
        ? `${safe.truncatedText}\n\n[Truncated.]`
        : safe.truncatedText,
      sessionId: input.session.id
    });

    const question =
      context.question ??
      input.question ??
      "Suggest the next useful question for this screen.";

    const prompt = buildScreenPrompt({
      context: ocrContext,
      question,
      task: "talkback_answer"
    });

    const response = await providerRouter.route({
      requiredCapabilities: ["chat", "fast_response", "low_cost"],
      preferredCostTier: "free",
      prompt,
      context: ocrContext,
      history: input.history ?? context.chatHistory ?? []
    });

    return {
      id: createId("assistant-message"),
      body: response.content,
      contextSessionId: input.session.id,
      createdAt: response.createdAt,
      role: "assistant"
    };
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
