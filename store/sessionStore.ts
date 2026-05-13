import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ChatMessage } from "@/types/chat";
import type { ScreenSession } from "@/types/screenSession";
import { storageService } from "@/services/storage";

/**
 * Session store — ephemeral UI state only.
 *
 * Fix: the `library` array has been removed from this store.
 * storageService (localStorageRepository / supabaseStorageRepository)
 * is the single source of truth for persisted sessions.
 * Screen components should call storageService.listScreenSessions()
 * to load the library, not read from Zustand.
 *
 * What remains here:
 *   currentSession   — the session currently open in the UI
 *   chatHistoryBySessionId — in-flight chat messages for the active session
 *
 * Only currentSession is persisted to AsyncStorage so the user can
 * resume after backgrounding the app. Chat history is ephemeral.
 */

type SessionState = {
  currentSession: ScreenSession | null;
  chatHistoryBySessionId: Record<string, ChatMessage[]>;

  setCurrentSession: (session: ScreenSession) => void;
  updateCurrentSession: (session: Partial<ScreenSession>) => void;
  clearCurrentSession: () => void;

  appendChatMessage: (sessionId: string, message: ChatMessage) => void;
  setChatHistory: (sessionId: string, messages: ChatMessage[]) => void;
  clearChatHistory: (sessionId: string) => void;

  /**
   * Saves the current session to the storage backend and returns the saved session.
   * Delegates to storageService — does NOT maintain a library array in Zustand.
   * Components that need the full library should call storageService.listScreenSessions().
   */
  saveCurrentSessionToLibrary: () => ScreenSession | null;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      chatHistoryBySessionId: {},
      currentSession: null,

      setCurrentSession: (session) => set({ currentSession: session }),

      updateCurrentSession: (partial) =>
        set((state) => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, ...partial }
            : null
        })),

      clearCurrentSession: () => set({ currentSession: null }),

      appendChatMessage: (sessionId, message) =>
        set((state) => ({
          chatHistoryBySessionId: {
            ...state.chatHistoryBySessionId,
            [sessionId]: [
              ...(state.chatHistoryBySessionId[sessionId] ?? []),
              message
            ]
          }
        })),

      setChatHistory: (sessionId, messages) =>
        set((state) => ({
          chatHistoryBySessionId: {
            ...state.chatHistoryBySessionId,
            [sessionId]: messages
          }
        })),

      saveCurrentSessionToLibrary: () => {
        const session = get()?.currentSession ?? null;
        if (!session) return null;
        const saved: ScreenSession = {
          ...session,
          savedAt: session.savedAt ?? new Date().toISOString()
        };
        // Fire-and-forget — caller handles the promise for error UI
        void storageService.saveScreenSession(saved).catch(() => {});
        return saved;
      },

      clearChatHistory: (sessionId) =>
        set((state) => {
          const next = { ...state.chatHistoryBySessionId };
          delete next[sessionId];
          return { chatHistoryBySessionId: next };
        })
    }),
    {
      name: "screensmart-session-store-v2",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the current session — chat history is ephemeral UI state
      partialize: (state) => ({ currentSession: state.currentSession })
    }
  )
);
