export type ChatRole = "assistant" | "user";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  body: string;
  createdAt: string;
  contextSessionId?: string;
};
