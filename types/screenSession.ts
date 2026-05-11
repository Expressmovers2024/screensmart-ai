import type { OcrExtractionResponse, UploadedScreenshot } from "@/services/ocr";
import type { AgentRun, ScreenIntelligenceOutput } from "@/src/agents";

export type { UploadedScreenshot } from "@/services/ocr";
export type OcrResult = OcrExtractionResponse;

export type ScreenSession = {
  id: string;
  screenshot?: UploadedScreenshot;
  ocr?: OcrResult;
  summary?: string;
  screenIntelligence?: ScreenIntelligenceOutput;
  agentRuns?: AgentRun[];
  createdAt: string;
  savedAt?: string;
};
