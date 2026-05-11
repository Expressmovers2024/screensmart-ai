import { ocrService, type OcrExtractionResponse, type UploadedScreenshot } from "@/services/ocr";

import { BaseAgent } from "../core/BaseAgent";
import type { AgentContext } from "../core/AgentTypes";

type OCRAgentInput = {
  image: UploadedScreenshot;
  sessionId: string;
};

export class OCRAgent extends BaseAgent<OCRAgentInput, OcrExtractionResponse> {
  constructor() {
    super({
      id: "screensmart.ocr",
      name: "OCRAgent",
      department: "screensmart",
      role: "Extract text from uploaded screenshots",
      description: "Runs the configured OCR provider and returns structured OCR text blocks."
    });
  }

  run(input: OCRAgentInput, context: AgentContext) {
    return ocrService.extractText({
      image: input.image,
      sessionId: input.sessionId,
      onProgress: (event) => {
        context.onProgress?.(event.message);
      }
    });
  }

  protected safeFallback(input: OCRAgentInput): OcrExtractionResponse {
    const text = [
      `Placeholder OCR extracted text from ${input.image.fileName ?? "uploaded screenshot"}.`,
      "ScreenSmart could not run OCR, so it used a safe fallback response.",
      "Continue the MVP flow with summary, TalkBack, notes, and memory using this placeholder text."
    ].join("\n");

    return {
      id: `${input.sessionId}-ocr-fallback`,
      blocks: [
        {
          id: `${input.sessionId}-ocr-block-fallback`,
          lines: text.split("\n").map((line, index) => ({
            id: `${input.sessionId}-ocr-line-${index}`,
            text: line
          })),
          text
        }
      ],
      confidence: 0.25,
      extractedText: text,
      processedAt: new Date().toISOString(),
      provider: "placeholder",
      rawText: text,
      sourceImage: input.image
    };
  }
}
