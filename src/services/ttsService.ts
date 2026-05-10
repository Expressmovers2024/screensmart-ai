export type TtsTrack = {
  id: string;
  title: string;
  durationLabel: string;
  script: string;
};

export const ttsService = {
  async createNarration(text: string): Promise<TtsTrack> {
    return {
      id: `tts-${Date.now()}`,
      title: "ScreenSmart narration",
      durationLabel: "00:42",
      script: text
    };
  },

  async play(trackId: string): Promise<{ trackId: string; status: "playing" }> {
    return { trackId, status: "playing" };
  }
};
