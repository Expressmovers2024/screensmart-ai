import type { OcrExtractionResponse, UploadedScreenshot } from "@/services/ocr";
import type { AiResponse } from "@/services/ai";
import type { ChatMessage } from "@/types/chat";
import type { ScreenSession } from "@/types/screenSession";

export type AgentStatus = "idle" | "running" | "success" | "error" | "blocked";

export type AgentDepartment =
  | "core"
  | "screensmart"
  | "research"
  | "browser"
  | "engineering";

export type AgentRun = {
  id: string;
  sessionId: string;
  agentId: string;
  agentName: string;
  status: AgentStatus;
  input: any;
  output: any;
  error?: string;
  startedAt: string;
  completedAt?: string;
};

export type ScreenIntelligenceOutput = {
  screenType: string;
  detectedTask: string;
  keyEntities: string[];
  summary: string;
  suggestedActions: string[];
  confidence: number;
};

export type AgentTimelineEntry = AgentRun;

export type AgentContext = {
  sessionId: string;
  session?: ScreenSession;
  screenshot?: UploadedScreenshot;
  ocr?: OcrExtractionResponse;
  summary?: AiResponse;
  screenIntelligence?: ScreenIntelligenceOutput;
  chatHistory?: ChatMessage[];
  question?: string;
  onProgress?: (message: string) => void;
  timeline?: AgentTimelineEntry[];
};

export type AgentMetadata = {
  id: string;
  name: string;
  department: AgentDepartment;
  role: string;
  description: string;
};

export type AgentExecutionResult<TOutput = unknown> = {
  output: TOutput;
  run: AgentRun;
};

export type AgentRunOptions<TInput = unknown> = {
  input: TInput;
  context: AgentContext;
};

export type AgentLike<TInput = unknown, TOutput = unknown> = AgentMetadata & {
  status: AgentStatus;
  input?: TInput;
  output?: TOutput;
  errors: string[];
  run: (input: TInput, context: AgentContext) => Promise<TOutput>;
};
