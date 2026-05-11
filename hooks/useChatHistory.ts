import { useSessionStore } from "@/store/sessionStore";

export function useChatHistory(sessionId: string) {
  return useSessionStore((state) => state.chatHistoryBySessionId[sessionId] ?? []);
}
