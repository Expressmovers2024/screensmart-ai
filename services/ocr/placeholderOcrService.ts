import type { OcrService } from "./types";
import { createId } from "@/utils/createId";

export const placeholderOcrService: OcrService = {
  async extractText({ image }) {
    const source = image.fileName ?? "uploaded screenshot";

    await new Promise((resolve) => setTimeout(resolve, 900));

    return {
      id: createId("ocr"),
      confidence: 0.94,
      extractedText: [
        `Placeholder OCR extracted text from ${source}.`,
        "",
        "ScreenSmart noticed a screen with important readable content, likely including a title, status message, and next action.",
        "",
        "Key details to review:",
        "- Confirm the visible account or app context.",
        "- Check any dates, warnings, amounts, or confirmation language.",
        "- Ask TalkBack to explain anything unclear before taking action."
      ].join("\n"),
      processedAt: new Date().toISOString(),
      provider: "placeholder"
    };
  }
};
