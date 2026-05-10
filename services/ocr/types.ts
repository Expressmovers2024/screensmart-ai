import type { OcrResult, UploadedScreenshot } from "@/types/screenSession";

export type OcrService = {
  extractText: (image: UploadedScreenshot) => Promise<OcrResult>;
};
