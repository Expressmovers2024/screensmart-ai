import { StyleSheet, Text, TextInput, View } from "react-native";

import { AppButton, AppScreen, Card } from "../../src/components/ui";
import { routes } from "../../src/navigation/routes";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

export default function TalkBackChatRoute() {
  return (
    <AppScreen
      title="TalkBack chat"
      subtitle="Placeholder assistant chat for follow-up questions about scanned screenshots."
    >
      <Card eyebrow="Assistant" title="Conversation preview">
        <View style={styles.assistantBubble}>
          <Text style={styles.author}>ScreenSmart</Text>
          <Text style={styles.message}>
            Ask me to explain the screenshot, simplify a phrase, or suggest what to do next.
          </Text>
        </View>
        <View style={styles.userBubble}>
          <Text style={styles.author}>You</Text>
          <Text style={styles.message}>What does this screen mean?</Text>
        </View>
      </Card>
      <Card title="Message composer">
        <TextInput
          accessibilityLabel="TalkBack message"
          editable={false}
          placeholder="Type a follow-up question..."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        <AppButton label="Send message" onPress={() => undefined} />
        <AppButton label="Review scan result" href={routes.scanResult} variant="secondary" />
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    gap: spacing.xs,
    maxWidth: "92%",
    padding: spacing.md
  },
  author: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.body,
    minHeight: 56,
    paddingHorizontal: spacing.md
  },
  message: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 24
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.lg,
    gap: spacing.xs,
    maxWidth: "92%",
    padding: spacing.md
  }
});
