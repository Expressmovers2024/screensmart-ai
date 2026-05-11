import { Pressable, Text, View } from "react-native";

import type { ScreenSession } from "@/types/screenSession";

type SessionCardProps = {
  session: ScreenSession;
  onPress?: () => void;
};

export function SessionCard({ session, onPress }: SessionCardProps) {
  const createdAt = new Date(session.savedAt ?? session.createdAt).toLocaleString();

  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      className="rounded-[28px] border border-white/10 bg-white/10 p-5 active:opacity-80"
      disabled={!onPress}
      onPress={onPress}
    >
      <Text className="text-xs font-black uppercase tracking-[1.5px] text-mint">{createdAt}</Text>
      <Text className="mt-2 text-xl font-black text-white">{session.title ?? "OCR session"}</Text>
      <Text className="mt-3 text-base leading-7 text-slate-300" numberOfLines={4}>
        {session.summary ?? session.ocr?.extractedText ?? "No extracted text saved for this session."}
      </Text>
      <View className="mt-4 flex-row flex-wrap gap-2">
        <Text className="rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[1px] text-slate-300">
          {session.ocr?.provider ?? "storage"}
        </Text>
        {session.ocr ? (
          <Text className="rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[1px] text-slate-300">
            {Math.round(session.ocr.confidence * 100)}% confidence
          </Text>
        ) : null}
        {(session.tags ?? []).slice(0, 4).map((tag) => (
          <Text className="rounded-full bg-electric/10 px-3 py-1 text-xs font-black uppercase tracking-[1px] text-electric" key={tag}>
            {tag}
          </Text>
        ))}
      </View>
      {session.workflowCheckpoints?.[0] ? (
        <Text className="mt-4 text-sm font-bold leading-6 text-slate-400">
          Open checkpoint: {session.workflowCheckpoints[0].title}
        </Text>
      ) : null}
      {onPress ? <Text className="mt-4 text-sm font-black text-electric">Open session</Text> : null}
    </Pressable>
  );
}
