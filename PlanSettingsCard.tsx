import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

import type { PlaybackState } from "@/services/tts";

type PlaybackIndicatorProps = {
  status: PlaybackState;
};

export function PlaybackIndicator({ status }: PlaybackIndicatorProps) {
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (status !== "playing") {
      pulse.setValue(0.5);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          duration: 650,
          toValue: 1,
          useNativeDriver: true
        }),
        Animated.timing(pulse, {
          duration: 650,
          toValue: 0.5,
          useNativeDriver: true
        })
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [pulse, status]);

  return (
    <View className="flex-row items-center gap-3">
      <Animated.View className="h-3 w-3 rounded-full bg-mint" style={{ opacity: pulse }} />
      <Text className="text-base font-black text-slate-200">{getStatusLabel(status)}</Text>
    </View>
  );
}

function getStatusLabel(status: PlaybackState) {
  switch (status) {
    case "playing":
      return "Reading aloud";
    case "paused":
      return "Paused";
    case "stopped":
      return "Stopped";
    case "idle":
    default:
      return "Ready";
  }
}
