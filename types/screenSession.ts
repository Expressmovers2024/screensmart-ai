export type { UploadedScreenshot } from "@/services/ocr";
export type OcrResult = import("@/services/ocr").OcrExtractionResponse;

export type ScreenSession = {
  id: string;
  screenshot?: UploadedScreenshot;
  ocr?: OcrResult;
  summary?: string;
  createdAt: string;
  savedAt?: string;
};
