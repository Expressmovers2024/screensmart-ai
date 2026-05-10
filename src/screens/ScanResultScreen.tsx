import { StyleSheet, Text, View } from "react-native";

import { AppShell } from "../components/AppShell";
import { PrimaryButton } from "../components/PrimaryButton";
import { SectionCard } from "../components/SectionCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import type { ScanResult } from "../types/content";
import type { Navigate } from "../types/navigation";

type ScanResultScreenProps = {
  navigate: Navigate;
  onSaveScan: () => Promise<void>;
  result: ScanResult;
};

export function ScanResultScreen({ navigate, onSaveScan, result }: ScanResultScreenProps) {
  return (
    <AppShell
      title="Scan result"
      subtitle={`Analysis for ${result.screenshotName}. This screen is wired to placeholder OCR and AI services.`}
    >
      <SectionCard eyebrow="Summary" title="Plain-language explanation">
        <Text style={styles.summary}>{result.summary}</Text>
      </SectionCard>

      <SectionCard title="Extracted text">
        <Text style={styles.extractedText}>{result.extractedText}</Text>
      </SectionCard>

      <SectionCard title="AI insights">
        {result.insights.map((insight) => (
          <View key={insight.id} style={styles.insight}>
            <Text style={styles.insightLabel}>{insight.label}</Text>
            <Text style={styles.insightBody}>{insight.body}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Suggested actions">
        {result.suggestedActions.map((action) => (
          <Text key={action} style={styles.action}>
            - {action}
          </Text>
        ))}
      </SectionCard>

      <View style={styles.actions}>
        <PrimaryButton label="Listen to result" onPress={() => navigate("audio")} />
        <PrimaryButton label="Ask a follow-up" onPress={() => navigate("talkback")} variant="secondary" />
        <PrimaryButton label="Save to library" onPress={onSaveScan} variant="ghost" />
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  action: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 24
  },
  actions: {
    gap: spacing.sm
  },
  extractedText: {
    color: colors.textMuted,
    fontSize: typography.body,
    fontStyle: "italic",
    lineHeight: 24
  },
  insight: {
    backgroundColor: colors.background,
    borderRadius: 18,
    gap: spacing.xs,
    padding: spacing.md
  },
  insightBody: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  insightLabel: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  summary: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "700",
    lineHeight: 30
  }
});
