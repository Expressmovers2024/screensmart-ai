import { useState } from "react";
import type { GestureResponderEvent, LayoutChangeEvent } from "react-native";
import { Pressable, Text, View } from "react-native";

type ProgressSliderProps = {
  progress: number;
  onSeek: (progress: number) => void;
};

export function ProgressSlider({ progress, onSeek }: ProgressSliderProps) {
  const [trackWidth, setTrackWidth] = useState(1);

  const handleLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(Math.max(1, event.nativeEvent.layout.width));
  };

  const handlePress = (event: GestureResponderEvent) => {
    const nextProgress = (event.nativeEvent.locationX / trackWidth) * 100;

    onSeek(Math.max(0, Math.min(100, nextProgress)));
  };

  return (
    <View>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-xs font-black uppercase tracking-[1.5px] text-slate-400">Progress</Text>
        <Text className="text-sm font-black text-electric">{Math.round(progress)}%</Text>
      </View>
      <Pressable
        accessibilityLabel="Playback progress slider"
        accessibilityRole="adjustable"
        className="h-7 justify-center"
        onLayout={handleLayout}
        onPress={handlePress}
      >
        <View className="h-3 overflow-hidden rounded-full bg-white/10">
          <View className="h-3 rounded-full bg-electric" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </View>
      </Pressable>
    </View>
  );
}
