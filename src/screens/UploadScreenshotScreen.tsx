import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppShell } from "../components/AppShell";
import { PrimaryButton } from "../components/PrimaryButton";
import { SectionCard } from "../components/SectionCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import type { Navigate } from "../types/navigation";

type UploadScreenshotScreenProps = {
  isScanning: boolean;
  navigate: Navigate;
  onRunDemoScan: () => Promise<void>;
};

export function UploadScreenshotScreen({
  isScanning,
  navigate,
  onRunDemoScan
}: UploadScreenshotScreenProps) {
  const [hasDemoScreenshot, setHasDemoScreenshot] = useState(false);

  return (
    <AppShell
      title="Upload screenshot"
      subtitle="Choose an image from your device later. For now, use the demo screenshot to exercise the analysis flow."
    >
      <SectionCard eyebrow="Screenshot source" title="Demo upload">
        <View style={styles.dropzone}>
          <Text style={styles.dropzoneIcon}>SS</Text>
          <Text style={styles.dropzoneTitle}>
            {hasDemoScreenshot ? "Demo screenshot ready" : "No screenshot selected"}
          </Text>
          <Text style={styles.dropzoneBody}>
            The MVP keeps image picking behind a placeholder so OCR and AI service boundaries stay clean.
          </Text>
        </View>
        <PrimaryButton
          label={hasDemoScreenshot ? "Replace demo screenshot" : "Use demo screenshot"}
          onPress={() => setHasDemoScreenshot(true)}
          variant="secondary"
        />
      </SectionCard>

      <SectionCard title="Scan pipeline">
        <View style={styles.step}>
          <Text style={styles.stepLabel}>1</Text>
          <Text style={styles.stepText}>OCR placeholder extracts readable text.</Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepLabel}>2</Text>
          <Text style={styles.stepText}>AI placeholder summarizes, explains, and suggests actions.</Text>
        </View>
        <PrimaryButton
          label={isScanning ? "Scanning..." : "Run mock scan"}
          onPress={onRunDemoScan}
          variant={hasDemoScreenshot ? "primary" : "secondary"}
        />
      </SectionCard>

      <PrimaryButton label="View last result" onPress={() => navigate("result")} variant="ghost" />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  dropzone: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 24,
    borderStyle: "dashed",
    borderWidth: 2,
    gap: spacing.sm,
    padding: spacing.xl
  },
  dropzoneBody: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 20,
    textAlign: "center"
  },
  dropzoneIcon: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    color: colors.surface,
    fontSize: typography.subtitle,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  dropzoneTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "800"
  },
  step: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  stepLabel: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  stepText: {
    color: colors.textMuted,
    flex: 1,
    fontSize: typography.body,
    lineHeight: 24
  }
});
