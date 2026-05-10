import type { ChatMessage } from "@/types/chat";
import type { ScreenSession } from "@/types/screenSession";
import { createId } from "@/utils/createId";

import { openRouterProvider, placeholderAiProvider } from "./providers";
import { buildScreenPrompt } from "./prompts/screenPrompts";
import { getModelForTask } from "./routing/modelRouter";
import { createOcrContext } from "./aiChatService";
import { getSafeAiContext } from "./utils/chunkText";
import type { AiProvider, AiProviderId, AiProviderRequest, AiResponse, AiService, AiTask } from "./types";

const providers: Record<AiProviderId, AiProvider | undefined> = {
  anthropic: undefined,
  gemini: undefined,
  ollama: undefined,
  openai: undefined,
  openrouter: openRouterProvider,
  placeholder: placeholderAiProvider
};

let activeProviderId: AiProviderId = "openrouter";

export const aiService: AiService = {
  getActiveProvider() {
    return getProvider(activeProviderId);
  },

  setActiveProvider(providerId) {
    activeProviderId = providerId;
  },

  summarize(session, style = "short") {
    return generateForSession({
      session,
      task: style === "short" ? "short_summary" : "detailed_summary"
    });
  },

  explain(session) {
    return generateForSession({
      session,
      task: "explain"
    });
  },

  generateKeyPoints(session) {
    return generateForSession({
      session,
      task: "key_points"
    });
  },

  async answerQuestion({ question, session, history }) {
    const response = await generateForSession({
      history,
      question,
      session,
      task: "talkback_answer"
    });

    return {
      id: createId("assistant-message"),
      role: "assistant",
      body: response.content,
      contextSessionId: session.id,
      createdAt: response.createdAt
    };
  }
};

async function generateForSession(input: {
  session: ScreenSession;
  task: AiTask;
  question?: string;
  history?: ChatMessage[];
}) {
  const context = createContextForSession(input.session);
  const prompt = buildScreenPrompt({
    context,
    question: input.question,
    task: input.task
  });
  const request: AiProviderRequest = {
    context,
    history: input.history,
    preferredModel: getModelForTask(activeProviderId, input.task),
    prompt,
    task: input.task
  };

  try {
    return await getProvider(activeProviderId).generate(request);
  } catch (error) {
    const fallback = await placeholderAiProvider.generate(request);

    return {
      ...fallback,
      content: `${fallback.content}\n\n_OpenRouter fallback used: ${
        error instanceof Error ? error.message : "provider unavailable"
      }_`,
      fallbackUsed: true
    } satisfies AiResponse;
  }
}

function createContextForSession(session: ScreenSession) {
  const safeContext = getSafeAiContext(session.ocr?.extractedText ?? session.summary ?? "No OCR text available.");

  return createOcrContext({
    confidence: session.ocr?.confidence,
    extractedText: safeContext.wasTruncated
      ? `${safeContext.truncatedText}\n\n[Content truncated to prevent context overflow.]`
      : safeContext.truncatedText,
    sessionId: session.id
  });
}

function getProvider(providerId: AiProviderId) {
  const provider = providers[providerId];

  if (!provider) {
    throw new Error(`AI provider "${providerId}" is not configured yet.`);
  }

  return provider;
}
