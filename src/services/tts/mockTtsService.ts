import type { TtsPlaybackResult, TtsPlaybackSettings, TtsVoice } from "./types";

export const availableMockVoices: TtsVoice[] = [
  {
    id: "calm-guide",
    name: "Calm Guide",
    description: "Warm, steady voice for summaries"
  },
  {
    id: "clear-reader",
    name: "Clear Reader",
    description: "Crisp voice for extracted text"
  },
  {
    id: "fast-focus",
    name: "Fast Focus",
    description: "Compact voice for quick reviews"
  }
];

export const mockTtsService = {
  async play(settings: TtsPlaybackSettings): Promise<TtsPlaybackResult> {
    return { settings, status: "playing" };
  },

  async pause(settings: TtsPlaybackSettings): Promise<TtsPlaybackResult> {
    return { settings, status: "paused" };
  },

  async stop(settings: TtsPlaybackSettings): Promise<TtsPlaybackResult> {
    return { settings, status: "stopped" };
  }
};
