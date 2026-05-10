import type { OcrResult, UploadedScreenshot } from "@/types/screenSession";

export type OcrProcessingStatus = "idle" | "processing" | "complete" | "error";

export type OcrExtractionRequest = {
  image: UploadedScreenshot;
  sessionId: string;
};

export type OcrExtractionResponse = OcrResult;

export type OcrService = {
  extractText: (request: OcrExtractionRequest) => Promise<OcrExtractionResponse>;
};
