import { useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { AppButton, AppScreen, Card } from "../../src/components/ui";
import { routes } from "../../src/navigation/routes";
import {
  defaultScreenSessionContext,
  mockAiService,
  type ChatMessage,
  type ScreenSessionContext
} from "../../src/services/ai";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

export default function TalkBackChatRoute() {
  const params = useLocalSearchParams<{
    confidence?: string;
    extractedText?: string;
    screenTitle?: string;
    summary?: string;
  }>();
  const context = useMemo<ScreenSessionContext>(
    () => ({
      confidence: params.confidence ?? defaultScreenSessionContext.confidence,
      extractedText: params.extractedText ?? defaultScreenSessionContext.extractedText,
      screenTitle: params.screenTitle ?? defaultScreenSessionContext.screenTitle,
      summary: params.summary ?? defaultScreenSessionContext.summary
    }),
    [params.confidence, params.extractedText, params.screenTitle, params.summary]
  );
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "assistant-welcome",
      role: "assistant",
      body: `I can answer questions using the current screen session: ${context.screenTitle}.`
    }
  ]);
  const [draft, setDraft] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const sendMessage = async () => {
    const question = draft.trim();

    if (!question || isThinking) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      body: question
    };
    const nextMessages = [...messages, userMessage];

    setDraft("");
    setMessages(nextMessages);
    setIsThinking(true);

    const response = await mockAiService.answerFromScreenSession({
      context,
      history: nextMessages,
      question
    });

    setMessages((current) => [...current, response]);
    setIsThinking(false);
  };

  const askSuggestion = (question: string) => {
    setDraft(question);
  };

  return (
    <AppScreen
      title="TalkBack chat"
      subtitle="Ask follow-up questions about the current screen session. Responses are mocked and grounded in OCR/session context."
    >
      <Card eyebrow="Current session" title={context.screenTitle}>
        <Text style={styles.contextLabel}>Mock extracted text</Text>
        <Text style={styles.contextText}>{context.extractedText}</Text>
        <Text style={styles.contextLabel}>Session summary</Text>
        <Text style={styles.contextText}>{context.summary}</Text>
      </Card>
      <Card eyebrow="Assistant" title="Conversation">
        <View style={styles.messageList}>
          {messages.map((message) => (
            <View
              key={message.id}
              style={[styles.bubble, message.role === "user" ? styles.userBubble : styles.assistantBubble]}
            >
              <Text style={styles.author}>{message.role === "user" ? "You" : "ScreenSmart"}</Text>
              <Text style={styles.message}>{message.body}</Text>
            </View>
          ))}
          {isThinking ? <Text style={styles.thinking}>ScreenSmart is reading the current screen session...</Text> : null}
        </View>
      </Card>
      <Card title="Suggested questions">
        <View style={styles.suggestionList}>
          <AppButton label="What does this mean?" onPress={() => askSuggestion("What does this screen mean?")} variant="secondary" />
          <AppButton label="What should I do next?" onPress={() => askSuggestion("What should I do next?")} variant="secondary" />
          <AppButton label="Any warnings or risks?" onPress={() => askSuggestion("Are there any warnings or risks?")} variant="secondary" />
        </View>
      </Card>
      <Card title="Message composer">
        <TextInput
          accessibilityLabel="TalkBack message"
          editable={!isThinking}
          multiline
          onChangeText={setDraft}
          placeholder="Type a follow-up question..."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={draft}
        />
        <AppButton label={isThinking ? "Thinking..." : "Send message"} onPress={sendMessage} disabled={!draft.trim() || isThinking} />
        <AppButton label="Review scan result" href={routes.scanResult} variant="secondary" />
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.background
  },
  author: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  bubble: {
    borderRadius: radius.lg,
    gap: spacing.xs,
    maxWidth: "92%",
    padding: spacing.md
  },
  contextLabel: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  contextText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.body,
    minHeight: 112,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md
  },
  message: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 24
  },
  messageList: {
    gap: spacing.md
  },
  suggestionList: {
    gap: spacing.sm
  },
  thinking: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontStyle: "italic"
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.lg
  }
});
