import { StyleSheet, Text, View } from "react-native";

import { AppButton, AppScreen, Card, ScreenSection } from "../../src/components/ui";
import { routes } from "../../src/navigation/routes";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

export default function UploadScreenshotRoute() {
  return (
    <AppScreen
      title="Upload screenshot"
      subtitle="Placeholder screen for choosing an image before OCR and AI processing are connected."
    >
      <Card eyebrow="Image source" title="Screenshot picker">
        <View style={styles.dropzone}>
          <Text style={styles.icon}>SS</Text>
          <Text style={styles.dropzoneTitle}>No screenshot selected</Text>
          <Text style={styles.dropzoneText}>Image picker integration will live here.</Text>
        </View>
        <AppButton label="Choose screenshot" variant="secondary" onPress={() => undefined} />
      </Card>
      <Card title="Scan flow">
        <ScreenSection
          items={[
            "Validate screenshot format.",
            "Send image to OCR service boundary.",
            "Navigate to scan result when analysis is ready."
          ]}
        />
        <AppButton label="View placeholder result" href={routes.scanResult} />
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  dropzone: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderStyle: "dashed",
    borderWidth: 2,
    gap: spacing.sm,
    padding: spacing.xl
  },
  dropzoneText: {
    color: colors.textMuted,
    fontSize: typography.body,
    textAlign: "center"
  },
  dropzoneTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "900"
  },
  icon: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    color: colors.surface,
    fontSize: typography.title,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  }
});
