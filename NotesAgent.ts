import TextRecognition from "@react-native-ml-kit/text-recognition";

import { createId } from "@/utils/createId";

import { preprocessImageForOcr } from "./imagePreprocessor";
import type { OcrExtractionResponse, OcrProvider, OcrTextBlock, OcrTextLine } from "../types";

type MlKitLine = {
  text: string;
};

type MlKitBlock = {
  text: string;
  lines: MlKitLine[];
};

type MlKitResult = {
  text: string;
  blocks: MlKitBlock[];
};

export const mlKitOcrProvider: OcrProvider = {
  id: "mlkit",
  label: "Google ML Kit on-device OCR",
  async extractText({ image, onProgress }): Promise<OcrExtractionResponse> {
    onProgress?.({
      message: "Optimizing screenshot for OCR...",
      progress: 0.18,
      status: "preprocessing"
    });

    const optimizedImage = await preprocessImageForOcr(image);

    onProgress?.({
      message: "Running on-device text recognition...",
      progress: 0.52,
      status: "processing"
    });

    const result = (await TextRecognition.recognize(optimizedImage.uri)) as MlKitResult;
    const blocks = normalizeBlocks(result.blocks);
    const extractedText = formatExtractedText(blocks, result.text);

    if (!extractedText.trim()) {
      throw new Error("No readable text was found in this image.");
    }

    onProgress?.({
      message: "Structuring extracted text...",
      progress: 0.88,
      status: "processing"
    });

    return {
      id: createId("ocr"),
      blocks,
      confidence: 0.92,
      extractedText,
      processedAt: new Date().toISOString(),
      provider: "mlkit",
      rawText: result.text ?? extractedText,
      sourceImage: optimizedImage
    };
  }
};

function normalizeBlocks(blocks: MlKitBlock[] = []): OcrTextBlock[] {
  return blocks.map((block, blockIndex) => {
    const lines: OcrTextLine[] = (block.lines ?? []).map((line, lineIndex) => ({
      id: createId(`ocr-line-${blockIndex}-${lineIndex}`),
      text: line.text
    }));

    return {
      id: createId(`ocr-block-${blockIndex}`),
      lines,
      text: lines.length > 0 ? lines.map((line) => line.text).join("\n") : block.text
    };
  });
}

function formatExtractedText(blocks: OcrTextBlock[], fallbackText?: string) {
  if (blocks.length === 0) {
    return fallbackText ?? "";
  }

  return blocks
    .map((block) => (block.lines.length > 0 ? block.lines.map((line) => line.text).join("\n") : block.text))
    .join("\n\n");
}
