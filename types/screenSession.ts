import type { OcrExtractionResponse, UploadedScreenshot } from "@/services/ocr";
import type { AgentRun, ScreenIntelligenceOutput, WorkflowCheckpoint } from "@/src/agents";

export type { UploadedScreenshot } from "@/services/ocr";
export type OcrResult = OcrExtractionResponse;

export type ScreenSession = {
  id: string;
  title?: string;
  tags?: string[];
  screenshot?: UploadedScreenshot;
  ocr?: OcrResult;
  summary?: string;
  screenIntelligence?: ScreenIntelligenceOutput;
  agentRuns?: AgentRun[];
  workflowCheckpoints?: WorkflowCheckpoint[];
  lastActiveAt?: string;
  createdAt: string;
  savedAt?: string;
};
