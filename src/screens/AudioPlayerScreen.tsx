import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppShell } from "../components/AppShell";
import { PrimaryButton } from "../components/PrimaryButton";
import { SectionCard } from "../components/SectionCard";
import { ttsService, type TtsTrack } from "../services";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import type { ScanResult } from "../types/content";
import type { Navigate } from "../types/navigation";

type AudioPlayerScreenProps = {
  navigate: Navigate;
  result: ScanResult;
};

export function AudioPlayerScreen({ navigate, result }: AudioPlayerScreenProps) {
  const [track, setTrack] = useState<TtsTrack | null>(null);
  const [status, setStatus] = useState<"idle" | "ready" | "playing">("idle");

  useEffect(() => {
    let isMounted = true;

    ttsService.createNarration(result.summary).then((nextTrack) => {
      if (isMounted) {
        setTrack(nextTrack);
        setStatus("ready");
      }
    });

    return () => {
      isMounted = false;
    };
  }, [result.summary]);

  const playTrack = async () => {
    if (!track) {
      return;
    }

    await ttsService.play(track.id);
    setStatus("playing");
  };

  return (
    <AppShell
      title="Audio player"
      subtitle="A future TTS integration will create spoken explanations from summaries and notes."
    >
      <SectionCard eyebrow="Narration" title={track?.title ?? "Preparing narration"}>
        <View style={styles.player}>
          <View style={styles.playCircle}>
            <Text style={styles.playIcon}>{status === "playing" ? "II" : ">"}</Text>
          </View>
          <Text style={styles.status}>{status === "playing" ? "Playing mock audio" : "Ready to listen"}</Text>
          <Text style={styles.duration}>{track?.durationLabel ?? "--:--"}</Text>
        </View>
        <Text style={styles.script}>{track?.script ?? "Generating placeholder narration..."}</Text>
      </SectionCard>

      <View style={styles.actions}>
        <PrimaryButton label={status === "playing" ? "Replay" : "Play explanation"} onPress={playTrack} />
        <PrimaryButton label="Back to result" onPress={() => navigate("result")} variant="secondary" />
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm
  },
  duration: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: "800"
  },
  playCircle: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 36,
    height: 72,
    justifyContent: "center",
    width: 72
  },
  playIcon: {
    color: colors.surface,
    fontSize: typography.title,
    fontWeight: "900"
  },
  player: {
    alignItems: "center",
    gap: spacing.sm
  },
  script: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24,
    textAlign: "center"
  },
  status: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "800"
  }
});
