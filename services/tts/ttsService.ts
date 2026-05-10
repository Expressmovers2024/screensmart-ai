import { createId } from "@/utils/createId";
import * as Speech from "expo-speech";

import type {
  AudioReaderChunk,
  CreatePlaybackSessionInput,
  PlaybackSpeed,
  TtsPlaybackSession,
  TtsService
} from "./types";

const WORDS_PER_MINUTE = 170;
const fallbackVoices = [
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

export const ttsService: TtsService = {
  createPlaybackSession({ sourceSessionId, text, voiceId, speed }: CreatePlaybackSessionInput) {
    const chunks = this.splitIntoReadableChunks(text);

    return {
      id: createId("playback-session"),
      backgroundPlaybackEnabled: false,
      chunks,
      currentChunkIndex: 0,
      estimatedSeconds: this.estimateReadingTime(text, speed),
      progress: 0,
      queue: [
        {
          id: createId("queue-item"),
          sourceSessionId,
          title: "Current OCR screen"
        }
      ],
      sourceSessionId,
      speed,
      status: "idle",
      text,
      updatedAt: new Date().toISOString(),
      voiceId
    };
  },

  splitIntoReadableChunks(text: string) {
    const normalizedText = text.trim() || "No OCR text is available yet.";
    const sentences = normalizedText
      .split(/(?<=[.!?])\s+|\n+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);
    const sourceChunks = sentences.length > 0 ? sentences : [normalizedText];

    return sourceChunks.map<AudioReaderChunk>((sentence, index) => ({
      id: createId(`reader-chunk-${index}`),
      estimatedSeconds: estimateChunkSeconds(sentence, 1),
      index,
      text: sentence
    }));
  },

  estimateReadingTime(text: string, speed: PlaybackSpeed) {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const adjustedWordsPerMinute = WORDS_PER_MINUTE * speed;

    return Math.max(5, Math.ceil((words / adjustedWordsPerMinute) * 60));
  },

  async prepareBackgroundPlayback() {
    return {
      enabled: false,
      reason: "Background playback is not enabled in the first mobile MVP."
    };
  },

  async speak(text, options) {
    await Speech.stop();
    Speech.speak(text, {
      language: "en-US",
      pitch: 1,
      rate: options.speed,
      voice: getNativeVoiceId(options.voiceId)
    });

    return "playing";
  },

  async pause() {
    if (typeof Speech.pause === "function") {
      await Speech.pause();
    } else {
      await Speech.stop();
    }

    return "paused";
  },

  async stop() {
    await Speech.stop();

    return "stopped";
  },

  async listVoices() {
    const nativeVoices = await Speech.getAvailableVoicesAsync();
    const englishVoices = nativeVoices.filter((voice) => voice.language?.toLowerCase().startsWith("en"));
    const voices = englishVoices.length > 0 ? englishVoices : nativeVoices;

    if (voices.length === 0) {
      return fallbackVoices;
    }

    return voices.slice(0, 6).map((voice) => ({
      description: `${voice.language ?? "System"} voice`,
      id: `native:${voice.identifier}`,
      label: voice.name || voice.identifier
    }));
  }
};

function estimateChunkSeconds(text: string, speed: PlaybackSpeed) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;

  return Math.max(2, Math.ceil((words / (WORDS_PER_MINUTE * speed)) * 60));
}

function getNativeVoiceId(voiceId: string) {
  return voiceId.startsWith("native:") ? voiceId.replace("native:", "") : undefined;
}
