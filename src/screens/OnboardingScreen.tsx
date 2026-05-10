import { StyleSheet, Text, View } from "react-native";

import { AppShell } from "../components/AppShell";
import { PrimaryButton } from "../components/PrimaryButton";
import { SectionCard } from "../components/SectionCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import type { Navigate } from "../types/navigation";

type OnboardingScreenProps = {
  navigate: Navigate;
};

const promises = [
  "Read important text from screenshots",
  "Summarize confusing screens in plain language",
  "Talk back with voice-friendly explanations"
];

export function OnboardingScreen({ navigate }: OnboardingScreenProps) {
  return (
    <AppShell
      title="Understand any screen faster."
      subtitle="ScreenSmart AI turns screenshots into OCR text, summaries, audio explanations, and follow-up conversations."
    >
      <SectionCard eyebrow="MVP preview" title="Built for screenshots first">
        {promises.map((promise) => (
          <View key={promise} style={styles.promiseRow}>
            <View style={styles.dot} />
            <Text style={styles.promiseText}>{promise}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="What is not included yet">
        <Text style={styles.body}>
          Live screen recording is intentionally out of scope for this foundation. The app starts with upload and
          analysis screens that can later connect to native capture permissions.
        </Text>
      </SectionCard>

      <PrimaryButton label="Start ScreenSmart" onPress={() => navigate("home")} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  dot: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    height: 12,
    marginTop: 5,
    width: 12
  },
  promiseRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md
  },
  promiseText: {
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    fontWeight: "700",
    lineHeight: 24
  }
});
