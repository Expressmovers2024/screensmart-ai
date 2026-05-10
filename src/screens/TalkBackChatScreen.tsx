import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { AppShell } from "../components/AppShell";
import { PrimaryButton } from "../components/PrimaryButton";
import { SectionCard } from "../components/SectionCard";
import { aiService } from "../services";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import type { ChatMessage, ScanResult } from "../types/content";
import type { Navigate } from "../types/navigation";

type TalkBackChatScreenProps = {
  navigate: Navigate;
  result: ScanResult;
};

const starterMessages: ChatMessage[] = [
  {
    id: "assistant-welcome",
    author: "assistant",
    body: "Ask me what the scanned screen means, what to do next, or what details may matter."
  }
];

export function TalkBackChatScreen({ navigate, result }: TalkBackChatScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [draft, setDraft] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const sendMessage = async () => {
    const question = draft.trim();

    if (!question || isThinking) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      author: "user",
      body: question
    };

    const nextMessages = [...messages, userMessage];

    setDraft("");
    setIsThinking(true);
    setMessages(nextMessages);

    const answer = await aiService.answerQuestion(question, nextMessages);
    setMessages((current) => [...current, answer]);
    setIsThinking(false);
  };

  return (
    <AppShell
      title="TalkBack chat"
      subtitle="Ask follow-up questions about your latest scan. Responses are mocked until AI credentials are connected."
    >
      <SectionCard eyebrow="Current context" title={result.screenshotName}>
        <Text style={styles.context}>{result.summary}</Text>
      </SectionCard>

      <SectionCard title="Conversation">
        {messages.map((message) => (
          <View
            key={message.id}
            style={[styles.bubble, message.author === "user" ? styles.userBubble : styles.assistantBubble]}
          >
            <Text style={styles.author}>{message.author === "user" ? "You" : "ScreenSmart"}</Text>
            <Text style={styles.message}>{message.body}</Text>
          </View>
        ))}
        {isThinking ? <Text style={styles.thinking}>ScreenSmart is drafting a placeholder answer...</Text> : null}
      </SectionCard>

      <View style={styles.composer}>
        <TextInput
          accessibilityLabel="TalkBack message"
          onChangeText={setDraft}
          placeholder="Ask about this screen..."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={draft}
        />
        <PrimaryButton label="Send" onPress={sendMessage} style={styles.sendButton} />
      </View>

      <PrimaryButton label="Back to result" onPress={() => navigate("result")} variant="ghost" />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.background
  },
  author: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  bubble: {
    borderRadius: 18,
    gap: spacing.xs,
    maxWidth: "92%",
    padding: spacing.md
  },
  composer: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm
  },
  context: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    minHeight: 52,
    paddingHorizontal: spacing.md
  },
  message: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 23
  },
  sendButton: {
    minHeight: 52,
    paddingHorizontal: spacing.md
  },
  thinking: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontStyle: "italic"
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#DBEAFE"
  }
});
