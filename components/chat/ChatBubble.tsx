import { Text, View } from "react-native";

import type { ChatMessage } from "@/types/chat";

type ChatBubbleProps = {
  message: ChatMessage;
};

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const timestamp = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });

  return (
    <View className={`max-w-[92%] rounded-3xl p-4 ${isUser ? "self-end bg-electric" : "self-start bg-white/10"}`}>
      <View className="mb-2 flex-row items-center justify-between gap-4">
        <Text className={`text-xs font-black uppercase tracking-[1.5px] ${isUser ? "text-ink/70" : "text-mint"}`}>
          {isUser ? "You" : "ScreenSmart"}
        </Text>
        <Text className={`text-xs font-bold ${isUser ? "text-ink/60" : "text-slate-400"}`}>{timestamp}</Text>
      </View>
      <Text className={`text-base leading-7 ${isUser ? "text-ink" : "text-slate-100"}`}>{message.body}</Text>
    </View>
  );
}
