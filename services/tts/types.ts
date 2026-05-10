export type PlaybackState = "idle" | "playing" | "paused" | "stopped";

export type PlaybackSpeed = 0.75 | 1 | 1.25 | 1.5 | 2;

export type TtsVoice = {
  id: string;
  label: string;
  description: string;
};

export type TtsPlaybackOptions = {
  speed: PlaybackSpeed;
  voiceId: string;
};

export type TtsService = {
  speak: (text: string, options: TtsPlaybackOptions) => Promise<PlaybackState>;
  pause: () => Promise<PlaybackState>;
  stop: () => Promise<PlaybackState>;
  listVoices: () => Promise<TtsVoice[]>;
};
