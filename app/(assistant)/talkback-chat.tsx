import { useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";

import { PrimaryButton, ReadableTextBlock, ScreenCard } from "@/components/ui";
import { routes } from "@/constants/routes";
import { useCurrentSession } from "@/hooks/useCurrentSession";
import { placeholderAiService } from "@/services/ai";
import type { ChatMessage } from "@/types/chat";
import type { ScreenSession } from "@/types/screenSession";
import { createId } from "@/utils/createId";

const starterPrompts = [
  "What does this screen mean?",
  "What should I do next?",
  "Are there any warnings or risks?"
];

const fallbackSession: ScreenSession = {
  id: "fallback-session",
  createdAt: new Date().toISOString(),
  ocr: {
    id: "fallback-ocr",
    confidence: 0.9,
    extractedText:
      "No active OCR session was found. Upload a screenshot first to ground TalkBack in real screen context.",
    processedAt: new Date().toISOString(),
    provider: "placeholder"
  }
};

export default function TalkBackChatRoute() {
  const router = useRouter();
  const currentSession = useCurrentSession();
  const session = currentSession ?? fallbackSession;
  const scrollRef = useRef<ScrollView>(null);
  const [draft, setDraft] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: createId("assistant-message"),
      role: "assistant",
      body: currentSession
        ? "Ask me anything about the current OCR session. I will answer using the extracted screen text."
        : "Upload and process a screenshot to give TalkBack live OCR context. You can still preview the chat flow here.",
      createdAt: new Date().toISOString()
    }
  ]);
  const contextLabel = useMemo(() => {
    if (!currentSession?.ocr) {
      return "No active OCR session";
    }

    return `OCR confidence ${Math.round(currentSession.ocr.confidence * 100)}%`;
  }, [currentSession?.ocr]);

  const sendMessage = async (questionOverride?: string) => {
    const question = (questionOverride ?? draft).trim();

    if (!question || isThinking) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createId("user-message"),
      role: "user",
      body: question,
      createdAt: new Date().toISOString()
    };
    const nextMessages = [...messages, userMessage];

    setDraft("");
    setMessages(nextMessages);
    setIsThinking(true);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

    const response = await placeholderAiService.answerQuestion({
      history: nextMessages,
      question,
      session
    });

    setMessages((currentMessages) => [...currentMessages, response]);
    setIsThinking(false);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-ink"
      keyboardVerticalOffset={24}
    >
      <ScrollView ref={scrollRef} className="flex-1" contentContainerClassName="px-6 pb-8 pt-14">
        <View className="mb-8">
          <Text className="text-xs font-black uppercase tracking-[2px] text-electric">TalkBack AI</Text>
          <Text className="mt-3 text-4xl font-black leading-tight text-white">Ask about this screen</Text>
          <Text className="mt-4 text-base leading-7 text-slate-300">
            Mock AI responses are grounded in the current OCR session context and extracted screen text.
          </Text>
        </View>

        <View className="gap-5">
          <ScreenCard eyebrow="Current OCR session" title={contextLabel}>
            <ReadableTextBlock text={session.ocr?.extractedText ?? "No extracted text available."} />
            {!currentSession ? (
              <PrimaryButton label="Upload screenshot first" onPress={() => router.push(routes.uploadScreenshot)} variant="secondary" />
            ) : null}
          </ScreenCard>

          <ScreenCard eyebrow="Conversation" title="Grounded chat">
            <View className="gap-4">
              {messages.map((message) => (
                <View
                  className={`max-w-[92%] rounded-3xl p-4 ${
                    message.role === "user" ? "self-end bg-electric" : "self-start bg-white/10"
                  }`}
                  key={message.id}
                >
                  <Text className={`text-xs font-black uppercase tracking-[1.5px] ${
                    message.role === "user" ? "text-ink/70" : "text-mint"
                  }`}
                  >
                    {message.role === "user" ? "You" : "ScreenSmart"}
                  </Text>
                  <Text className={`mt-2 text-base leading-7 ${message.role === "user" ? "text-ink" : "text-slate-100"}`}>
                    {message.body}
                  </Text>
                </View>
              ))}
              {isThinking ? (
                <Text className="text-sm font-bold italic text-slate-400">
                  ScreenSmart is reading the current OCR session...
                </Text>
              ) : null}
            </View>
          </ScreenCard>

          <ScreenCard eyebrow="Quick prompts" title="Suggested questions">
            {starterPrompts.map((prompt) => (
              <PrimaryButton
                disabled={isThinking}
                key={prompt}
                label={prompt}
                onPress={() => sendMessage(prompt)}
                variant="secondary"
              />
            ))}
          </ScreenCard>
        </View>
      </ScrollView>

      <View className="border-t border-white/10 bg-panel px-6 pb-6 pt-4">
        <TextInput
          accessibilityLabel="TalkBack question"
          className="min-h-24 rounded-3xl border border-white/10 bg-white/10 px-5 py-4 text-base leading-6 text-white"
          editable={!isThinking}
          multiline
          onChangeText={setDraft}
          placeholder="Ask a question about this screen..."
          placeholderTextColor="#94A3B8"
          textAlignVertical="top"
          value={draft}
        />
        <View className="mt-3">
          <PrimaryButton
            disabled={!draft.trim() || isThinking}
            label={isThinking ? "Thinking..." : "Send message"}
            onPress={() => sendMessage()}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
