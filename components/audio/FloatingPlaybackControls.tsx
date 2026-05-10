import { Text, View } from "react-native";

import { PrimaryButton } from "@/components/ui";
import type { PlaybackState } from "@/services/tts";

type FloatingPlaybackControlsProps = {
  status: PlaybackState;
  busy?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
};

export function FloatingPlaybackControls({
  status,
  busy = false,
  onPlay,
  onPause,
  onStop,
  onSkipBack,
  onSkipForward
}: FloatingPlaybackControlsProps) {
  return (
    <View className="rounded-[32px] border border-white/10 bg-panel/95 p-4">
      <Text className="mb-3 text-center text-xs font-black uppercase tracking-[2px] text-slate-400">Playback controls</Text>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <PrimaryButton disabled={busy} label="Prev" onPress={onSkipBack} variant="secondary" />
        </View>
        <View className="flex-1">
          {status === "playing" ? (
            <PrimaryButton disabled={busy} label={busy ? "Working..." : "Pause"} onPress={onPause} />
          ) : (
            <PrimaryButton disabled={busy} label={busy ? "Working..." : "Play"} onPress={onPlay} />
          )}
        </View>
        <View className="flex-1">
          <PrimaryButton disabled={busy} label="Next" onPress={onSkipForward} variant="secondary" />
        </View>
      </View>
      <View className="mt-3">
        <PrimaryButton disabled={busy} label="Stop" onPress={onStop} variant="ghost" />
      </View>
    </View>
  );
}
