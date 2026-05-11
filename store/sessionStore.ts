import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ChatMessage } from "@/types/chat";
import type { ScreenSession } from "@/types/screenSession";

type SessionState = {
  currentSession: ScreenSession | null;
  library: ScreenSession[];
  chatHistoryBySessionId: Record<string, ChatMessage[]>;
  setCurrentSession: (session: ScreenSession) => void;
  updateCurrentSession: (session: Partial<ScreenSession>) => void;
  saveCurrentSessionToLibrary: () => ScreenSession | null;
  appendChatMessage: (sessionId: string, message: ChatMessage) => void;
  setChatHistory: (sessionId: string, messages: ChatMessage[]) => void;
  clearChatHistory: (sessionId: string) => void;
  clearCurrentSession: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      chatHistoryBySessionId: {},
      currentSession: null,
      library: [],
      setCurrentSession: (session) => set({ currentSession: session }),
      updateCurrentSession: (session) =>
        set((state) => ({
          currentSession: state.currentSession ? { ...state.currentSession, ...session } : null
        })),
      saveCurrentSessionToLibrary: () => {
        const currentSession = get().currentSession;

        if (!currentSession) {
          return null;
        }

        const savedSession = {
          ...currentSession,
          savedAt: new Date().toISOString()
        };

        set((state) => ({
          currentSession: savedSession,
          library: [savedSession, ...state.library.filter((session) => session.id !== savedSession.id)]
        }));

        return savedSession;
      },
      appendChatMessage: (sessionId, message) =>
        set((state) => ({
          chatHistoryBySessionId: {
            ...state.chatHistoryBySessionId,
            [sessionId]: [...(state.chatHistoryBySessionId[sessionId] ?? []), message]
          }
        })),
      setChatHistory: (sessionId, messages) =>
        set((state) => ({
          chatHistoryBySessionId: {
            ...state.chatHistoryBySessionId,
            [sessionId]: messages
          }
        })),
      clearChatHistory: (sessionId) =>
        set((state) => {
          const nextHistory = { ...state.chatHistoryBySessionId };

          delete nextHistory[sessionId];

          return { chatHistoryBySessionId: nextHistory };
        }),
      clearCurrentSession: () => set({ currentSession: null })
    }),
    {
      name: "screensmart-session-store",
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);
