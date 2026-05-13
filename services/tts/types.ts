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

export type AudioReaderChunk = {
  id: string;
  index: number;
  text: string;
  estimatedSeconds: number;
};

export type PlaybackQueueItem = {
  id: string;
  sourceSessionId?: string;
  title: string;
};

export type TtsPlaybackSession = {
  id: string;
  sourceSessionId?: string;
  text: string;
  chunks: AudioReaderChunk[];
  currentChunkIndex: number;
  progress: number;
  status: PlaybackState;
  speed: PlaybackSpeed;
  voiceId: string;
  estimatedSeconds: number;
  backgroundPlaybackEnabled: boolean;
  queue: PlaybackQueueItem[];
  updatedAt: string;
};

export type CreatePlaybackSessionInput = {
  sourceSessionId?: string;
  text: string;
  voiceId: string;
  speed: PlaybackSpeed;
};

export type TtsService = {
  createPlaybackSession: (input: CreatePlaybackSessionInput) => TtsPlaybackSession;
  splitIntoReadableChunks: (text: string) => AudioReaderChunk[];
  estimateReadingTime: (text: string, speed: PlaybackSpeed) => number;
  prepareBackgroundPlayback: (session: TtsPlaybackSession) => Promise<{ enabled: false; reason: string }>;
  speak: (text: string, options: TtsPlaybackOptions) => Promise<PlaybackState>;
  pause: () => Promise<PlaybackState>;
  stop: () => Promise<PlaybackState>;
  listVoices: () => Promise<TtsVoice[]>;
};
