import { StyleSheet, Text, View } from "react-native";

import { AppButton, AppScreen, Card, InfoPill } from "../../src/components/ui";
import { routes } from "../../src/navigation/routes";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

export default function AudioPlayerRoute() {
  return (
    <AppScreen
      title="Audio player"
      subtitle="Placeholder TTS playback screen for hands-free scan explanations."
    >
      <Card eyebrow="Narration" title="Screen explanation">
        <View style={styles.player}>
          <View style={styles.playButton}>
            <Text style={styles.playIcon}>Play</Text>
          </View>
          <Text style={styles.nowPlaying}>Ready to play placeholder audio</Text>
          <View style={styles.stats}>
            <InfoPill label="Length" value="0:42" />
            <InfoPill label="Voice" value="Clear" />
          </View>
        </View>
        <AppButton label="Play audio" onPress={() => undefined} />
      </Card>
      <Card title="Next">
        <AppButton label="Back to scan result" href={routes.scanResult} variant="secondary" />
        <AppButton label="Ask a question" href={routes.talkbackChat} variant="secondary" />
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  nowPlaying: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "900",
    textAlign: "center"
  },
  playButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 104,
    justifyContent: "center",
    width: 104
  },
  playIcon: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: "900"
  },
  player: {
    alignItems: "center",
    gap: spacing.md
  },
  stats: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%"
  }
});
