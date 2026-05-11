import { createId } from "@/utils/createId";

import type { OcrExtractionResponse, OcrProvider } from "../types";

export const placeholderOcrProvider: OcrProvider = {
  id: "placeholder",
  label: "Placeholder OCR provider",
  async extractText({ image, onProgress }): Promise<OcrExtractionResponse> {
    const source = image.fileName ?? "uploaded screenshot";

    onProgress?.({
      message: "Running fallback placeholder OCR...",
      progress: 0.5,
      status: "processing"
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    const lines = [
      `Placeholder OCR extracted text from ${source}.`,
      "ScreenSmart noticed a screen with important readable content.",
      "Use the ML Kit provider in native builds for real OCR extraction."
    ];

    return {
      id: createId("ocr"),
      blocks: [
        {
          id: createId("ocr-block"),
          lines: lines.map((line) => ({
            id: createId("ocr-line"),
            text: line
          })),
          text: lines.join("\n")
        }
      ],
      confidence: 0.5,
      extractedText: lines.join("\n"),
      processedAt: new Date().toISOString(),
      provider: "placeholder",
      rawText: lines.join("\n"),
      sourceImage: image
    };
  }
};
