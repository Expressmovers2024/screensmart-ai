import { useSessionStore } from "@/store/sessionStore";

export function useCurrentSession() {
  return useSessionStore((state) => state.currentSession);
}
