import type { OcrImageInput, OcrResult } from "./types";

const MOCK_LINES = [
  "ScreenSmart AI mock OCR result",
  "Detected screenshot content: account reminder, due date, and next action.",
  "Suggested focus: review key details before continuing."
];

export const mockOcrService = {
  async extractTextFromImage(image: OcrImageInput): Promise<OcrResult> {
    const sourceName = image.fileName ?? "selected screenshot";
    const dimensions = image.width && image.height ? ` (${image.width} x ${image.height})` : "";

    return {
      confidence: 0.94,
      extractedText: [`Source: ${sourceName}${dimensions}`, ...MOCK_LINES].join("\n"),
      provider: "mock"
    };
  }
};
