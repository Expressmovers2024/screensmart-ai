import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { FloatingPlaybackControls, MiniPlayer, VoiceSelector } from "@/components/audio";
import { PrimaryButton, ScreenCard } from "@/components/ui";
import { useCurrentSession } from "@/hooks/useCurrentSession";
import { storageService } from "@/services/storage";
import { ttsService, type PlaybackSpeed, type TtsVoice } from "@/services/tts";
import { usePlaybackStore } from "@/store/playbackStore";

const speedOptions: PlaybackSpeed[] = [0.75, 1, 1.25, 1.5, 2];
const fallbackReaderText =
  "Upload a screenshot and run OCR to hear ScreenSmart read extracted screen content aloud. This is placeholder audio playback for now.";

export default function AudioPlayerRoute() {
  const currentSession = useCurrentSession();
  const readerText = currentSession?.ocr?.extractedText ?? currentSession?.summary ?? fallbackReaderText;
  const currentPlaybackSession = usePlaybackStore((state) => state.currentPlaybackSession);
  const setPlaybackSession = usePlaybackStore((state) => state.setPlaybackSession);
  const updatePlaybackSession = usePlaybackStore((state) => state.updatePlaybackSession);
  const setStatus = usePlaybackStore((state) => state.setStatus);
  const setVoiceId = usePlaybackStore((state) => state.setVoiceId);
  const skipToChunk = usePlaybackStore((state) => state.skipToChunk);
  const [voices, setVoices] = useState<TtsVoice[]>([]);

  useEffect(() => {
    ttsService.listVoices().then(setVoices);
  }, []);

  useEffect(() => {
    const sourceSessionId = currentSession?.id;

    if (currentPlaybackSession?.text === readerText && currentPlaybackSession.sourceSessionId === sourceSessionId) {
      return;
    }

    setPlaybackSession(
      ttsService.createPlaybackSession({
        sourceSessionId,
        speed: currentPlaybackSession?.speed ?? 1,
        text: readerText,
        voiceId: currentPlaybackSession?.voiceId ?? "calm-guide"
      })
    );
  }, [
    currentPlaybackSession?.sourceSessionId,
    currentPlaybackSession?.speed,
    currentPlaybackSession?.text,
    currentPlaybackSession?.voiceId,
    currentSession?.id,
    readerText,
    setPlaybackSession
  ]);

  useEffect(() => {
    if (currentPlaybackSession?.status !== "playing") {
      return;
    }

    const interval = setInterval(() => {
      const nextProgress = Math.min(100, currentPlaybackSession.progress + currentPlaybackSession.speed * 1.1);
      const nextChunkIndex = getChunkIndexForProgress(nextProgress, currentPlaybackSession.chunks.length);

      updatePlaybackSession({
        currentChunkIndex: nextChunkIndex,
        progress: nextProgress,
        status: nextProgress >= 100 ? "stopped" : "playing"
      });
    }, 500);

    return () => clearInterval(interval);
  }, [currentPlaybackSession, updatePlaybackSession]);

  const selectedVoice = useMemo(
    () => voices.find((voice) => voice.id === currentPlaybackSession?.voiceId) ?? voices[0],
    [currentPlaybackSession?.voiceId, voices]
  );

  const play = async () => {
    if (!currentPlaybackSession) {
      return;
    }

    if (currentPlaybackSession.progress >= 100) {
      updatePlaybackSession({
        currentChunkIndex: 0,
        progress: 0
      });
    }

    const nextState = await ttsService.speak(currentPlaybackSession.text, {
      speed: currentPlaybackSession.speed,
      voiceId: currentPlaybackSession.voiceId
    });

    setStatus(nextState);
    void storageService.saveAudioEvent({
      id: `${currentPlaybackSession.id}-play-${Date.now()}`,
      eventType: nextState,
      playbackSessionId: currentPlaybackSession.id,
      progress: currentPlaybackSession.progress,
      sessionId: currentPlaybackSession.sourceSessionId,
      metadata: {
        speed: currentPlaybackSession.speed,
        voiceId: currentPlaybackSession.voiceId
      }
    });
  };

  const pause = async () => {
    const nextState = await ttsService.pause();

    setStatus(nextState);
    if (currentPlaybackSession) {
      void storageService.saveAudioEvent({
        id: `${currentPlaybackSession.id}-pause-${Date.now()}`,
        eventType: nextState,
        playbackSessionId: currentPlaybackSession.id,
        progress: currentPlaybackSession.progress,
        sessionId: currentPlaybackSession.sourceSessionId
      });
    }
  };

  const stop = async () => {
    const nextState = await ttsService.stop();

    updatePlaybackSession({
      currentChunkIndex: 0,
      progress: 0,
      status: nextState
    });
    if (currentPlaybackSession) {
      void storageService.saveAudioEvent({
        id: `${currentPlaybackSession.id}-stop-${Date.now()}`,
        eventType: nextState,
        playbackSessionId: currentPlaybackSession.id,
        progress: 0,
        sessionId: currentPlaybackSession.sourceSessionId
      });
    }
  };

  const seek = (nextProgress: number) => {
    if (!currentPlaybackSession) {
      return;
    }

    updatePlaybackSession({
      currentChunkIndex: getChunkIndexForProgress(nextProgress, currentPlaybackSession.chunks.length),
      progress: nextProgress
    });
  };

  const changeSpeed = (nextSpeed: PlaybackSpeed) => {
    if (!currentPlaybackSession) {
      return;
    }

    updatePlaybackSession({
      estimatedSeconds: ttsService.estimateReadingTime(currentPlaybackSession.text, nextSpeed),
      speed: nextSpeed
    });
  };

  const skipBack = () => {
    if (currentPlaybackSession) {
      skipToChunk(currentPlaybackSession.currentChunkIndex - 1);
    }
  };

  const skipForward = () => {
    if (currentPlaybackSession) {
      skipToChunk(currentPlaybackSession.currentChunkIndex + 1);
    }
  };

  if (!currentPlaybackSession) {
    return (
      <View className="flex-1 bg-ink px-6 pt-14">
        <Text className="text-4xl font-black text-white">Preparing audio reader...</Text>
      </View>
    );
  }

  const currentChunk = currentPlaybackSession.chunks[currentPlaybackSession.currentChunkIndex];

  return (
    <View className="flex-1 bg-ink">
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-48 pt-14">
        <View className="mb-8">
          <Text className="text-xs font-black uppercase tracking-[2px] text-electric">Audio reader</Text>
          <Text className="mt-3 text-4xl font-black leading-tight text-white">Listen to screen text</Text>
          <Text className="mt-4 text-base leading-7 text-slate-300">
            Mock audiobook-style playback for OCR content. Real TTS and background audio will connect behind services/tts later.
          </Text>
        </View>

        <View className="gap-5">
          <MiniPlayer onSeek={seek} session={currentPlaybackSession} voice={selectedVoice} />

          <ScreenCard eyebrow="Currently spoken" title="Sentence highlight placeholder">
            <View className="rounded-[28px] border border-mint/30 bg-mint/10 p-5">
              <Text className="text-xl font-black leading-8 text-white">{currentChunk?.text ?? currentPlaybackSession.text}</Text>
            </View>
            <Text className="text-sm font-bold text-slate-400">
              Chunk {currentPlaybackSession.currentChunkIndex + 1} of {currentPlaybackSession.chunks.length} • Queue{" "}
              {currentPlaybackSession.queue.length} item
            </Text>
          </ScreenCard>

          <ScreenCard eyebrow="Speed" title="Playback speed">
            <View className="flex-row flex-wrap gap-3">
              {speedOptions.map((option) => {
                const isSelected = option === currentPlaybackSession.speed;

                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    className={`min-h-14 min-w-[72px] flex-1 items-center justify-center rounded-2xl border px-4 ${
                      isSelected ? "border-electric bg-electric" : "border-white/10 bg-white/10"
                    }`}
                    key={option}
                    onPress={() => changeSpeed(option)}
                  >
                    <Text className={`text-base font-black ${isSelected ? "text-ink" : "text-white"}`}>{option}x</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScreenCard>

          <ScreenCard eyebrow="Voice selector" title="Placeholder voices">
            <VoiceSelector voices={voices} selectedVoiceId={currentPlaybackSession.voiceId} onSelectVoice={setVoiceId} />
          </ScreenCard>

          <ScreenCard eyebrow="Playback architecture" title="Session, queue, and background placeholders">
            <Text className="text-base leading-7 text-slate-300">
              Background playback is scaffolded as a service hook and remains disabled until real TTS audio is connected.
            </Text>
            <Text className="text-base leading-7 text-slate-300">
              Queue placeholder: {currentPlaybackSession.queue.map((item) => item.title).join(", ")}
            </Text>
            <View className="gap-3">
              <PrimaryButton label="Summarize First" onPress={() => undefined} variant="secondary" />
              <PrimaryButton label="Explain This Section" onPress={() => undefined} variant="secondary" />
            </View>
          </ScreenCard>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 px-5 pb-6">
        <FloatingPlaybackControls
          onPause={pause}
          onPlay={play}
          onSkipBack={skipBack}
          onSkipForward={skipForward}
          onStop={stop}
          status={currentPlaybackSession.status}
        />
      </View>
    </View>
  );
}

function getChunkIndexForProgress(progress: number, chunkCount: number) {
  if (chunkCount <= 1) {
    return 0;
  }

  return Math.max(0, Math.min(chunkCount - 1, Math.round((progress / 100) * (chunkCount - 1))));
}
