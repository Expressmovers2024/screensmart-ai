import { Pressable, Text, View } from "react-native";

import type { TtsVoice } from "@/services/tts";

type VoiceSelectorProps = {
  voices: TtsVoice[];
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
};

export function VoiceSelector({ voices, selectedVoiceId, onSelectVoice }: VoiceSelectorProps) {
  return (
    <View className="gap-3">
      {voices.map((voice) => {
        const isSelected = voice.id === selectedVoiceId;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            className={`rounded-3xl border p-4 ${isSelected ? "border-mint bg-mint/20" : "border-white/10 bg-white/5"}`}
            key={voice.id}
            onPress={() => onSelectVoice(voice.id)}
          >
            <Text className="text-lg font-black text-white">{voice.label}</Text>
            <Text className="mt-1 text-base leading-6 text-slate-300">{voice.description}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
