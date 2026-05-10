import { StyleSheet, Text, View } from "react-native";

import { AppShell } from "../components/AppShell";
import { InfoRow } from "../components/InfoRow";
import { PrimaryButton } from "../components/PrimaryButton";
import { SectionCard } from "../components/SectionCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import type { Navigate } from "../types/navigation";

type HomeScreenProps = {
  navigate: Navigate;
};

export function HomeScreen({ navigate }: HomeScreenProps) {
  return (
    <AppShell
      title="Your screen companion"
      subtitle="Upload a screenshot, get a plain-language explanation, then ask follow-up questions or listen hands-free."
    >
      <SectionCard eyebrow="Next action" title="Scan a screenshot">
        <Text style={styles.body}>
          Start with a saved screenshot. ScreenSmart will run placeholder OCR and AI processing in this MVP.
        </Text>
        <PrimaryButton label="Upload screenshot" onPress={() => navigate("upload")} />
      </SectionCard>

      <View style={styles.grid}>
        <InfoRow label="Scans" value="2 saved" />
        <InfoRow label="Notes" value="2 drafts" />
      </View>

      <SectionCard title="Quick access">
        <View style={styles.actions}>
          <PrimaryButton label="TalkBack chat" onPress={() => navigate("talkback")} variant="secondary" />
          <PrimaryButton label="Audio player" onPress={() => navigate("audio")} variant="secondary" />
          <PrimaryButton label="Open notes" onPress={() => navigate("notes")} variant="secondary" />
        </View>
      </SectionCard>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm
  },
  body: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  grid: {
    flexDirection: "row",
    gap: spacing.md
  }
});
