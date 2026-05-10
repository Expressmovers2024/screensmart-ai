import type { TtsService } from "./types";

export const placeholderTtsService: TtsService = {
  async speak() {
    return "playing";
  },

  async pause() {
    return "paused";
  },

  async stop() {
    return "stopped";
  },

  async listVoices() {
    return [
      {
        id: "calm-guide",
        label: "Calm Guide",
        description: "Warm voice for patient screen explanations"
      },
      {
        id: "clear-reader",
        label: "Clear Reader",
        description: "Crisp voice for OCR text and details"
      },
      {
        id: "fast-focus",
        label: "Fast Focus",
        description: "Compact voice for quick reviews"
      }
    ];
  }
};
