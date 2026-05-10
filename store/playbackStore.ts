import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { PlaybackSpeed, PlaybackState, TtsPlaybackSession } from "@/services/tts";

type PlaybackStateStore = {
  currentPlaybackSession: TtsPlaybackSession | null;
  setPlaybackSession: (session: TtsPlaybackSession) => void;
  updatePlaybackSession: (updates: Partial<TtsPlaybackSession>) => void;
  setStatus: (status: PlaybackState) => void;
  setProgress: (progress: number) => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  setVoiceId: (voiceId: string) => void;
  skipToChunk: (chunkIndex: number) => void;
  clearPlaybackSession: () => void;
};

export const usePlaybackStore = create<PlaybackStateStore>()(
  persist(
    (set) => ({
      currentPlaybackSession: null,
      setPlaybackSession: (session) => set({ currentPlaybackSession: session }),
      updatePlaybackSession: (updates) =>
        set((state) => ({
          currentPlaybackSession: state.currentPlaybackSession
            ? { ...state.currentPlaybackSession, ...updates, updatedAt: new Date().toISOString() }
            : null
        })),
      setStatus: (status) =>
        set((state) => ({
          currentPlaybackSession: state.currentPlaybackSession
            ? { ...state.currentPlaybackSession, status, updatedAt: new Date().toISOString() }
            : null
        })),
      setProgress: (progress) =>
        set((state) => ({
          currentPlaybackSession: state.currentPlaybackSession
            ? {
                ...state.currentPlaybackSession,
                progress: Math.max(0, Math.min(100, progress)),
                updatedAt: new Date().toISOString()
              }
            : null
        })),
      setSpeed: (speed) =>
        set((state) => ({
          currentPlaybackSession: state.currentPlaybackSession
            ? { ...state.currentPlaybackSession, speed, updatedAt: new Date().toISOString() }
            : null
        })),
      setVoiceId: (voiceId) =>
        set((state) => ({
          currentPlaybackSession: state.currentPlaybackSession
            ? { ...state.currentPlaybackSession, voiceId, updatedAt: new Date().toISOString() }
            : null
        })),
      skipToChunk: (chunkIndex) =>
        set((state) => {
          const session = state.currentPlaybackSession;

          if (!session) {
            return { currentPlaybackSession: null };
          }

          const nextChunkIndex = Math.max(0, Math.min(session.chunks.length - 1, chunkIndex));
          const progress = session.chunks.length <= 1 ? 0 : (nextChunkIndex / (session.chunks.length - 1)) * 100;

          return {
            currentPlaybackSession: {
              ...session,
              currentChunkIndex: nextChunkIndex,
              progress,
              updatedAt: new Date().toISOString()
            }
          };
        }),
      clearPlaybackSession: () => set({ currentPlaybackSession: null })
    }),
    {
      name: "screensmart-playback-store",
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);
