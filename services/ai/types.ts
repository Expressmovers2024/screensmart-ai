import type { ChatMessage } from "@/types/chat";
import type { ScreenSession } from "@/types/screenSession";

export type OcrContextCategory = "financial" | "article" | "instructions" | "chart_or_table" | "general";

export type AiProviderId = "openrouter" | "openai" | "anthropic" | "ollama" | "gemini" | "placeholder";

export type AiTask =
  | "short_summary"
  | "detailed_summary"
  | "key_points"
  | "explain"
  | "talkback_answer"
  | "vision_analysis"
  | "research_planning";

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

export type AiUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimated?: boolean;
};

export type AiResponseFormat = "markdown";

export type AiResponse = {
  id: string;
  provider: AiProviderId;
  model: string;
  task: AiTask;
  content: string;
  format: AiResponseFormat;
  usage: AiUsage;
  createdAt: string;
  finishReason?: string;
  fallbackUsed?: boolean;
  streamed: boolean;
};

export type AiStreamChunk = {
  id: string;
  contentDelta: string;
  done: boolean;
  usage?: AiUsage;
};

export type AiProviderRequest = {
  task: AiTask;
  context: OcrContext;
  prompt: string;
  history?: ChatMessage[];
  preferredModel?: string;
  preferredModels?: string[];
  /** Ordered list of fallback model IDs if the primary model fails */
  fallbackModels?: string[];
};

export type AiProvider = {
  id: AiProviderId;
  label: string;
  generate: (request: AiProviderRequest) => Promise<AiResponse>;
  stream?: (request: AiProviderRequest) => AsyncIterable<AiStreamChunk>;
};

export type AiChatResponse = {
  message: ChatMessage;
  contextCategory: OcrContextCategory;
  referencedText: string;
  aiResponse: AiResponse;
};

export type AiService = {
  getActiveProvider: () => AiProvider;
  setActiveProvider: (providerId: AiProviderId) => void;
  summarize: (session: ScreenSession, style?: "short" | "detailed") => Promise<AiResponse>;
  explain: (session: ScreenSession) => Promise<AiResponse>;
  generateKeyPoints: (session: ScreenSession) => Promise<AiResponse>;
  answerQuestion: (input: {
    question: string;
    session: ScreenSession;
    history: ChatMessage[];
  }) => Promise<ChatMessage>;
};
