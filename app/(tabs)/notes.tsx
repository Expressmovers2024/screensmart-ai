import { StyleSheet, Text } from "react-native";

import { AppButton, AppScreen, Card, ScreenSection } from "../../src/components/ui";
import { routes } from "../../src/navigation/routes";
import { colors, typography } from "../../src/theme/tokens";

export default function NotesRoute() {
  return (
    <AppScreen
      title="Notes"
      subtitle="Placeholder workspace for reminders, follow-ups, and saved plain-language explanations."
    >
      <Card eyebrow="Draft" title="Scan note template">
        <Text style={styles.note}>
          Write down what the screen means, questions to ask later, or next actions from a scan.
        </Text>
      </Card>
      <Card title="Note actions">
        <ScreenSection
          items={[
            "Create notes from scan results.",
            "Attach TalkBack answers to saved notes.",
            "Sync notes through the future storage layer."
          ]}
        />
        <AppButton label="Ask TalkBack" href={routes.talkbackChat} />
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  note: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  }
});
