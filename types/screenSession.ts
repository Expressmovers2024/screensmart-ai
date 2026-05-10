import type { OcrExtractionResponse, UploadedScreenshot } from "@/services/ocr";

export type { UploadedScreenshot } from "@/services/ocr";
export type OcrResult = OcrExtractionResponse;

export type ScreenSession = {
  id: string;
  screenshot?: UploadedScreenshot;
  ocr?: OcrResult;
  summary?: string;
  createdAt: string;
  savedAt?: string;
};
