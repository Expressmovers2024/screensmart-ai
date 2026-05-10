import type { OcrService } from "./types";

export const placeholderOcrService: OcrService = {
  async extractText(image) {
    const source = image.fileName ?? "uploaded screenshot";

    return {
      confidence: 0.94,
      extractedText: `Placeholder OCR extracted text from ${source}. Production OCR will be connected behind this service boundary.`,
      provider: "placeholder"
    };
  }
};
