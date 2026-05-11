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
  inputSummary?: string;
  outputSummary?: string;
  confidence?: number;
  durationMs?: number;
  error?: string;
  startedAt: string;
  completedAt?: string;
};

export type ScreenIntelligenceOutput = {
  screenType: string;
  appOrWebsite: string;
  visualSummary: string;
  layoutDescription: string;
  detectedTask: string;
  userIntentGuess: string;
  keyEntities: string[];
  visibleProblems: string[];
  importantVisualElements: string[];
  importantNumbers: string[];
  suggestedActions: string[];
  confidence: number;
  fallbackUsed: boolean;
  reasoningSummary: string;
  summary: string;
};

export type WorkflowCheckpointStatus = "open" | "completed" | "skipped";

export type WorkflowCheckpoint = {
  id: string;
  sessionId: string;
  title: string;
  description: string;
  agentId: string;
  createdAt: string;
  status: WorkflowCheckpointStatus;
  nextActions: string[];
};

export type ContinueTaskPlan = {
  checkpoint: WorkflowCheckpoint;
  recommendedNextSteps: string[];
  reasoningSummary: string;
};

export type AgentTimelineEntry = AgentRun;

export type AgentContext = {
  sessionId: string;
  session?: ScreenSession;
  screenshot?: UploadedScreenshot;
  ocr?: OcrExtractionResponse;
  summary?: AiResponse;
  screenIntelligence?: ScreenIntelligenceOutput;
  workflowCheckpoints?: WorkflowCheckpoint[];
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
