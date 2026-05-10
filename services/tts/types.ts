export type PlaybackState = "idle" | "playing" | "paused" | "stopped";

export type TtsVoice = {
  id: string;
  label: string;
};

export type TtsService = {
  speak: (text: string) => Promise<PlaybackState>;
  pause: () => Promise<PlaybackState>;
  stop: () => Promise<PlaybackState>;
  listVoices: () => Promise<TtsVoice[]>;
};
