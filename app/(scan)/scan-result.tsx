import { StyleSheet, Text, View } from "react-native";

import { AppButton, AppScreen, Card, ScreenSection } from "../../src/components/ui";
import { routes } from "../../src/navigation/routes";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

export default function ScanResultRoute() {
  return (
    <AppScreen
      title="Scan result"
      subtitle="Placeholder result surface for extracted text, AI summary, and suggested next steps."
    >
      <Card eyebrow="AI summary" title="Plain-language explanation">
        <Text style={styles.summary}>
          This placeholder will summarize the uploaded screenshot and explain what matters most.
        </Text>
      </Card>
      <Card title="Extracted text">
        <View style={styles.textBlock}>
          <Text style={styles.extractedText}>OCR output preview will appear here.</Text>
        </View>
      </Card>
      <Card title="Suggested actions">
        <ScreenSection
          items={[
            "Listen to the explanation.",
            "Ask a follow-up question in TalkBack chat.",
            "Save the scan to library or notes."
          ]}
        />
        <AppButton label="Listen to result" href={routes.audioPlayer} />
        <AppButton label="Ask TalkBack" href={routes.talkbackChat} variant="secondary" />
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  extractedText: {
    color: colors.textMuted,
    fontSize: typography.body,
    fontStyle: "italic",
    lineHeight: 24
  },
  summary: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "800",
    lineHeight: 28
  },
  textBlock: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.md
  }
});
