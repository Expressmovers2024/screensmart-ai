import { create } from "zustand";

import type { ScreenSession } from "@/types/screenSession";

type SessionState = {
  currentSession: ScreenSession | null;
  setCurrentSession: (session: ScreenSession) => void;
  clearCurrentSession: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  currentSession: null,
  setCurrentSession: (session) => set({ currentSession: session }),
  clearCurrentSession: () => set({ currentSession: null })
}));
