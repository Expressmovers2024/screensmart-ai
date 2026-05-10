import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { PrimaryButton, ReadableTextBlock, ScreenCard } from "@/components/ui";
import { useCurrentSession } from "@/hooks/useCurrentSession";
import {
  placeholderTtsService,
  type PlaybackSpeed,
  type PlaybackState,
  type TtsVoice
} from "@/services/tts";

const speedOptions: PlaybackSpeed[] = [0.75, 1, 1.25, 1.5, 2];
const fallbackReaderText =
  "Upload a screenshot and run OCR to hear ScreenSmart read extracted screen content aloud. This is placeholder audio playback for now.";

export default function AudioPlayerRoute() {
  const currentSession = useCurrentSession();
  const readerText = currentSession?.ocr?.extractedText ?? currentSession?.summary ?? fallbackReaderText;
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [voices, setVoices] = useState<TtsVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState("calm-guide");

  useEffect(() => {
    placeholderTtsService.listVoices().then((availableVoices) => {
      setVoices(availableVoices);
      setSelectedVoiceId((currentVoiceId) => currentVoiceId || availableVoices[0]?.id || "calm-guide");
    });
  }, []);

  useEffect(() => {
    if (playbackState !== "playing") {
      return;
    }

    const interval = setInterval(() => {
      setProgress((currentProgress) => {
        const nextProgress = Math.min(100, currentProgress + speed * 1.25);

        if (nextProgress >= 100) {
          setPlaybackState("stopped");
        }

        return nextProgress;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [playbackState, speed]);

  const selectedVoice = useMemo(
    () => voices.find((voice) => voice.id === selectedVoiceId) ?? voices[0],
    [selectedVoiceId, voices]
  );

  const play = async () => {
    if (progress >= 100) {
      setProgress(0);
    }

    const nextState = await placeholderTtsService.speak(readerText, {
      speed,
      voiceId: selectedVoiceId
    });

    setPlaybackState(nextState);
  };

  const pause = async () => {
    const nextState = await placeholderTtsService.pause();

    setPlaybackState(nextState);
  };

  const stop = async () => {
    const nextState = await placeholderTtsService.stop();

    setPlaybackState(nextState);
    setProgress(0);
  };

  return (
    <ScrollView className="flex-1 bg-ink" contentContainerClassName="px-6 pb-12 pt-14">
      <View className="mb-8">
        <Text className="text-xs font-black uppercase tracking-[2px] text-electric">Audio reader</Text>
        <Text className="mt-3 text-4xl font-black leading-tight text-white">Listen to screen text</Text>
        <Text className="mt-4 text-base leading-7 text-slate-300">
          Mock text-to-speech controls for reading OCR output aloud. Real audio will connect behind services/tts later.
        </Text>
      </View>

      <View className="gap-5">
        <ScreenCard eyebrow="Now reading" title={selectedVoice?.label ?? "Placeholder voice"}>
          <ReadableTextBlock text={readerText} />
          <View>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-sm font-black uppercase tracking-[1.5px] text-slate-400">Progress</Text>
              <Text className="text-sm font-black text-electric">{Math.round(progress)}%</Text>
            </View>
            <View className="h-3 overflow-hidden rounded-full bg-white/10">
              <View className="h-3 rounded-full bg-electric" style={{ width: `${progress}%` }} />
            </View>
          </View>
          <Text className="text-base font-bold text-slate-300">{getPlaybackLabel(playbackState)}</Text>
        </ScreenCard>

        <ScreenCard eyebrow="Controls" title="Playback">
          <PrimaryButton disabled={playbackState === "playing"} label="Play" onPress={play} />
          <PrimaryButton disabled={playbackState !== "playing"} label="Pause" onPress={pause} variant="secondary" />
          <PrimaryButton
            disabled={playbackState === "idle" || (playbackState === "stopped" && progress === 0)}
            label="Stop"
            onPress={stop}
            variant="secondary"
          />
        </ScreenCard>

        <ScreenCard eyebrow="Speed" title="Playback speed">
          <View className="flex-row flex-wrap gap-3">
            {speedOptions.map((option) => {
              const isSelected = option === speed;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  className={`min-h-14 min-w-[72px] flex-1 items-center justify-center rounded-2xl border px-4 ${
                    isSelected ? "border-electric bg-electric" : "border-white/10 bg-white/10"
                  }`}
                  key={option}
                  onPress={() => setSpeed(option)}
                >
                  <Text className={`text-base font-black ${isSelected ? "text-ink" : "text-white"}`}>{option}x</Text>
                </Pressable>
              );
            })}
          </View>
        </ScreenCard>

        <ScreenCard eyebrow="Voice selector" title="Placeholder voices">
          {voices.map((voice) => {
            const isSelected = voice.id === selectedVoiceId;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                className={`rounded-3xl border p-4 ${
                  isSelected ? "border-mint bg-mint/20" : "border-white/10 bg-white/5"
                }`}
                key={voice.id}
                onPress={() => setSelectedVoiceId(voice.id)}
              >
                <Text className="text-lg font-black text-white">{voice.label}</Text>
                <Text className="mt-1 text-base leading-6 text-slate-300">{voice.description}</Text>
              </Pressable>
            );
          })}
        </ScreenCard>
      </View>
    </ScrollView>
  );
}

function getPlaybackLabel(playbackState: PlaybackState) {
  switch (playbackState) {
    case "playing":
      return "Playing placeholder narration";
    case "paused":
      return "Paused";
    case "stopped":
      return "Stopped";
    case "idle":
    default:
      return "Ready to play";
  }
}
