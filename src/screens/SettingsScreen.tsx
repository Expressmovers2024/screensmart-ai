import { StyleSheet, Text, View } from "react-native";

import { AppShell } from "../components/AppShell";
import { InfoRow } from "../components/InfoRow";
import { PrimaryButton } from "../components/PrimaryButton";
import { SectionCard } from "../components/SectionCard";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import type { Navigate } from "../types/navigation";

type SettingsScreenProps = {
  navigate: Navigate;
};

const serviceStatuses = [
  ["OCR", "Placeholder"],
  ["AI processing", "Placeholder"],
  ["Text to speech", "Placeholder"],
  ["Supabase", "Placeholder"]
] as const;

export function SettingsScreen({ navigate }: SettingsScreenProps) {
  return (
    <AppShell
      title="Settings"
      subtitle="Configure accessibility, voice, and service integrations as the MVP grows."
    >
      <SectionCard eyebrow="Accessibility" title="Mobile-first defaults">
        <Text style={styles.body}>
          Large tap targets, plain language, and audio-first flows are part of the foundation.
        </Text>
        <View style={styles.settingsList}>
          <InfoRow label="Voice speed" value="Normal" />
          <InfoRow label="Contrast" value="High clarity" />
          <InfoRow label="Live recording" value="Not built yet" />
        </View>
      </SectionCard>

      <SectionCard title="Service readiness">
        {serviceStatuses.map(([label, value]) => (
          <InfoRow key={label} label={label} value={value} />
        ))}
      </SectionCard>

      <PrimaryButton label="Return home" onPress={() => navigate("home")} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  settingsList: {
    gap: spacing.sm
  }
});
