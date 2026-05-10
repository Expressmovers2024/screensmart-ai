import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton, AppScreen, Card, InfoPill } from "../../src/components/ui";
import { routes } from "../../src/navigation/routes";
import { availableMockVoices, mockTtsService, type TtsPlaybackStatus, type TtsSpeed } from "../../src/services/tts";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

const speedOptions: TtsSpeed[] = [0.75, 1, 1.25, 1.5];

export default function AudioPlayerRoute() {
  const [status, setStatus] = useState<TtsPlaybackStatus>("idle");
  const [speed, setSpeed] = useState<TtsSpeed>(1);
  const [voiceId, setVoiceId] = useState(availableMockVoices[0].id);
  const selectedVoice = useMemo(
    () => availableMockVoices.find((voice) => voice.id === voiceId) ?? availableMockVoices[0],
    [voiceId]
  );
  const playbackSettings = { speed, voiceId };

  const playAudio = async () => {
    const result = await mockTtsService.play(playbackSettings);

    setStatus(result.status);
  };

  const pauseAudio = async () => {
    const result = await mockTtsService.pause(playbackSettings);

    setStatus(result.status);
  };

  const stopAudio = async () => {
    const result = await mockTtsService.stop(playbackSettings);

    setStatus(result.status);
  };

  return (
    <AppScreen
      title="Audio player"
      subtitle="Placeholder TTS playback controls for hands-free scan explanations."
    >
      <Card eyebrow="Narration" title="Screen explanation">
        <View style={styles.player}>
          <View style={[styles.playButton, status === "playing" && styles.playingButton]}>
            <Text style={styles.playIcon}>{status === "playing" ? "On" : "TTS"}</Text>
          </View>
          <Text style={styles.nowPlaying}>{getStatusLabel(status)}</Text>
          <View style={styles.stats}>
            <InfoPill label="Length" value="0:42" />
            <InfoPill label="Voice" value={selectedVoice.name} />
          </View>
        </View>
        <View style={styles.controls}>
          <AppButton label="Play" onPress={playAudio} disabled={status === "playing"} />
          <AppButton label="Pause" onPress={pauseAudio} variant="secondary" disabled={status !== "playing"} />
          <AppButton label="Stop" onPress={stopAudio} variant="secondary" disabled={status === "idle" || status === "stopped"} />
        </View>
      </Card>
      <Card eyebrow="Playback" title="Speed controls">
        <View style={styles.speedGrid}>
          {speedOptions.map((option) => {
            const isSelected = option === speed;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={option}
                onPress={() => setSpeed(option)}
                style={[styles.speedButton, isSelected && styles.selectedOption]}
              >
                <Text style={[styles.speedLabel, isSelected && styles.selectedOptionLabel]}>{option}x</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>
      <Card eyebrow="Voice selector" title="Placeholder voices">
        <View style={styles.voiceList}>
          {availableMockVoices.map((voice) => {
            const isSelected = voice.id === voiceId;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={voice.id}
                onPress={() => setVoiceId(voice.id)}
                style={[styles.voiceOption, isSelected && styles.selectedOption]}
              >
                <Text style={[styles.voiceName, isSelected && styles.selectedOptionLabel]}>{voice.name}</Text>
                <Text style={[styles.voiceDescription, isSelected && styles.selectedOptionDescription]}>
                  {voice.description}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>
      <Card title="Next">
        <AppButton label="Back to scan result" href={routes.scanResult} variant="secondary" />
        <AppButton label="Ask a question" href={routes.talkbackChat} variant="secondary" />
      </Card>
    </AppScreen>
  );
}

function getStatusLabel(status: TtsPlaybackStatus) {
  switch (status) {
    case "playing":
      return "Playing mock narration";
    case "paused":
      return "Paused";
    case "stopped":
      return "Stopped";
    case "idle":
    default:
      return "Ready to play placeholder audio";
  }
}

const styles = StyleSheet.create({
  controls: {
    gap: spacing.sm
  },
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
  playingButton: {
    backgroundColor: colors.success
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
  },
  speedButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    minHeight: 56,
    minWidth: 72,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  speedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  speedLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  selectedOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  selectedOptionDescription: {
    color: colors.surface
  },
  selectedOptionLabel: {
    color: colors.surface
  },
  voiceDescription: {
    color: colors.textMuted,
    fontSize: typography.caption,
    lineHeight: 18
  },
  voiceList: {
    gap: spacing.sm
  },
  voiceName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  voiceOption: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    minHeight: 72,
    padding: spacing.md
  }
});
