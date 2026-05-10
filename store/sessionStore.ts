import { create } from "zustand";

import type { ScreenSession } from "@/types/screenSession";

type SessionState = {
  currentSession: ScreenSession | null;
  library: ScreenSession[];
  setCurrentSession: (session: ScreenSession) => void;
  updateCurrentSession: (session: Partial<ScreenSession>) => void;
  saveCurrentSessionToLibrary: () => ScreenSession | null;
  clearCurrentSession: () => void;
};

export const useSessionStore = create<SessionState>((set, get) => ({
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
  clearCurrentSession: () => set({ currentSession: null })
}));
