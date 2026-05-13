import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { ChatBubble, TypingIndicator } from "@/components/chat";
import { PrimaryButton, ReadableTextBlock, RetryState, ScreenCard } from "@/components/ui";
import { routes } from "@/constants/routes";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useCurrentSession } from "@/hooks/useCurrentSession";
import { aiService, createOcrContext } from "@/services/ai";
import { storageService } from "@/services/storage";
import { useSessionStore } from "@/store/sessionStore";
import type { ChatMessage } from "@/types/chat";
import type { ScreenSession } from "@/types/screenSession";
import { createId } from "@/utils/createId";

const starterPrompts = [
  "What does this screen mean?",
  "Ask about screen: summarize this.",
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
    blocks: [
      {
        id: "fallback-block",
        lines: [
          {
            id: "fallback-line",
            text: "No active OCR session was found. Upload a screenshot first to ground TalkBack in real screen context."
          }
        ],
        text: "No active OCR session was found. Upload a screenshot first to ground TalkBack in real screen context."
      }
    ],
    processedAt: new Date().toISOString(),
    provider: "placeholder",
    rawText: "No active OCR session was found. Upload a screenshot first to ground TalkBack in real screen context.",
    sourceImage: {
      uri: "placeholder://talkback"
    }
  }
};

export default function TalkBackChatRoute() {
  const router = useRouter();
  const currentSession = useCurrentSession();
  const session = currentSession ?? fallbackSession;
  const chatHistory = useChatHistory(session.id);
  const appendChatMessage = useSessionStore((state) => state.appendChatMessage);
  const setChatHistory = useSessionStore((state) => state.setChatHistory);
  const scrollRef = useRef<ScrollView>(null);
  const [draft, setDraft] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [microphoneStatus, setMicrophoneStatus] = useState("Microphone placeholder");
  const [hasLoadedStoredMessages, setHasLoadedStoredMessages] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(null);
  const ocrContext = useMemo(
    () =>
      createOcrContext({
        confidence: session.ocr?.confidence,
        extractedText: session.ocr?.extractedText,
        sessionId: session.id
      }),
    [session.id, session.ocr?.confidence, session.ocr?.extractedText]
  );
  const contextLabel = useMemo(() => {
    if (!currentSession?.ocr) {
      return "No active OCR session";
    }

    return `OCR confidence ${Math.round(currentSession.ocr.confidence * 100)}%`;
  }, [currentSession?.ocr]);

  useEffect(() => {
    let isMounted = true;

    storageService
      .listAiMessages(session.id)
      .then((messages) => {
        if (isMounted && messages.length > 0) {
          setChatHistory(session.id, messages);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load saved TalkBack messages.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setHasLoadedStoredMessages(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session.id, setChatHistory]);

  useEffect(() => {
    if (!hasLoadedStoredMessages || chatHistory.length > 0) {
      return;
    }

    appendChatMessage(session.id, {
      id: createId("assistant-message"),
      role: "assistant",
      body: currentSession
        ? "Ask me anything about the current OCR session. I will answer using the extracted screen text."
        : "Upload and process a screenshot to give TalkBack live OCR context. You can still preview the chat flow here.",
      contextSessionId: session.id,
      createdAt: new Date().toISOString()
    });
  }, [appendChatMessage, chatHistory.length, currentSession, hasLoadedStoredMessages, session.id]);

  const sendMessage = async (questionOverride?: string) => {
    const question = (questionOverride ?? draft).trim();

    if (!question || isThinking) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createId("user-message"),
      role: "user",
      body: question,
      contextSessionId: session.id,
      createdAt: new Date().toISOString()
    };
    const nextMessages = [...chatHistory, userMessage];

    setDraft("");
    setErrorMessage(null);
    setFallbackMessage(null);
    setLastFailedQuestion(null);
    appendChatMessage(session.id, userMessage);
    void storageService.saveAiMessage(userMessage, session.id);
    setIsThinking(true);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

    try {
      const response = await aiService.answerQuestion({
        history: nextMessages,
        question,
        session
      });

      appendChatMessage(session.id, response);
      void storageService.saveAiMessage(response, session.id);
      if (response.body.includes("_AI proxy fallback used:")) {
        setFallbackMessage(
          "The Supabase AI proxy was unavailable or returned an error, so TalkBack showed the mock fallback response."
        );
      }
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    } catch (error) {
      setLastFailedQuestion(question);
      setErrorMessage(error instanceof Error ? error.message : "TalkBack could not answer that question.");
    } finally {
      setIsThinking(false);
    }
  };

  const handleMicrophonePress = () => {
    setMicrophoneStatus("Voice input placeholder - coming soon");
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
            Follow-up answers are grounded in the current OCR session context and extracted screen text.
          </Text>
        </View>

        <View className="gap-5">
          <ScreenCard eyebrow="Current OCR session" title={contextLabel}>
            <ReadableTextBlock text={session.ocr?.extractedText ?? "No extracted text available."} />
            <Text className="text-xs font-black uppercase tracking-[1.5px] text-slate-400">
              Detected context: {ocrContext.category.replace("_", " ")}
            </Text>
            {!currentSession ? (
              <PrimaryButton label="Upload screenshot first" onPress={() => router.push(routes.uploadScreenshot)} variant="secondary" />
            ) : null}
          </ScreenCard>

          <ScreenCard eyebrow="Conversation" title="Grounded chat">
            <View className="gap-4">
              {chatHistory.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
              {isThinking ? <TypingIndicator /> : null}
            </View>
          </ScreenCard>

          {errorMessage ? (
            <RetryState
              title="TalkBack failed"
              message={errorMessage}
              onRetry={() => {
                if (lastFailedQuestion) {
                  void sendMessage(lastFailedQuestion);
                } else {
                  setErrorMessage(null);
                }
              }}
            />
          ) : null}

          {fallbackMessage ? (
            <ScreenCard eyebrow="AI proxy fallback" title="Using mock TalkBack response">
              <Text className="text-base leading-7 text-amber-100">
                {fallbackMessage} Check `EXPO_PUBLIC_AI_PROXY_URL`, the deployed function, and the server-side
                `OPENROUTER_API_KEY`, then retry.
              </Text>
              <PrimaryButton
                label="Retry last question"
                onPress={() => {
                  const latestUserMessage = [...chatHistory].reverse().find((message) => message.role === "user");

                  if (latestUserMessage) {
                    void sendMessage(latestUserMessage.body);
                  } else {
                    setFallbackMessage(null);
                  }
                }}
              />
            </ScreenCard>
          ) : null}

          <ScreenCard eyebrow="Ask About Screen" title="Quick prompts">
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
        <View className="flex-row gap-3">
          <TextInput
            accessibilityLabel="TalkBack question"
            className="min-h-24 flex-1 rounded-3xl border border-white/10 bg-white/10 px-5 py-4 text-base leading-6 text-white"
            editable={!isThinking}
            multiline
            onChangeText={setDraft}
            placeholder="Ask a question about this screen..."
            placeholderTextColor="#94A3B8"
            textAlignVertical="top"
            value={draft}
          />
          <Pressable
            accessibilityLabel="Microphone input placeholder"
            accessibilityRole="button"
            className="h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/10"
            onPress={handleMicrophonePress}
          >
            <Text className="text-sm font-black text-mint">Mic</Text>
          </Pressable>
        </View>
        <Text className="mt-2 text-xs font-bold text-slate-400">{microphoneStatus}</Text>
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
