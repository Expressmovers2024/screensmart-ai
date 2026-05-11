import { Text, View } from "react-native";

import { PlaybackIndicator } from "./PlaybackIndicator";
import { ProgressSlider } from "./ProgressSlider";
import type { TtsPlaybackSession, TtsVoice } from "@/services/tts";

type MiniPlayerProps = {
  session: TtsPlaybackSession;
  voice?: TtsVoice;
  onSeek: (progress: number) => void;
};

export function MiniPlayer({ session, voice, onSeek }: MiniPlayerProps) {
  return (
    <View className="rounded-[32px] border border-electric/20 bg-electric/10 p-5">
      <View className="mb-4 flex-row items-start justify-between gap-4">
        <View className="flex-1">
          <Text className="text-xs font-black uppercase tracking-[2px] text-electric">Mini player</Text>
          <Text className="mt-2 text-2xl font-black text-white">{voice?.label ?? "Placeholder voice"}</Text>
          <Text className="mt-1 text-sm font-bold text-slate-300">
            {Math.ceil(session.estimatedSeconds / 60)} min estimated reading time
          </Text>
        </View>
        <PlaybackIndicator status={session.status} />
      </View>
      <ProgressSlider onSeek={onSeek} progress={session.progress} />
    </View>
  );
}
