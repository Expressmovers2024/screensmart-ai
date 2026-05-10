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
      { id: "calm-guide", label: "Calm Guide" },
      { id: "clear-reader", label: "Clear Reader" }
    ];
  }
};
