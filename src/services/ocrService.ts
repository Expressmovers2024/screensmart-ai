import type { ScreenshotSource } from "../types/content";

export type OcrResponse = {
  text: string;
  confidence: number;
};

export const ocrService = {
  async extractText(source: ScreenshotSource): Promise<OcrResponse> {
    return {
      text: `Mock OCR text extracted from ${source.name}. Replace this placeholder with on-device or cloud OCR.`,
      confidence: 0.94
    };
  }
};
