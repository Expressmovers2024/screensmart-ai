export type TtsPlaybackStatus = "idle" | "playing" | "paused" | "stopped";

export type TtsSpeed = 0.75 | 1 | 1.25 | 1.5;

export type TtsVoice = {
  id: string;
  name: string;
  description: string;
};

export type TtsPlaybackSettings = {
  speed: TtsSpeed;
  voiceId: string;
};

export type TtsPlaybackResult = {
  status: TtsPlaybackStatus;
  settings: TtsPlaybackSettings;
};
