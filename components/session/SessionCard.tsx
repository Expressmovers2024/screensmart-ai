import { Text, View } from "react-native";

import type { ScreenSession } from "@/types/screenSession";

type SessionCardProps = {
  session: ScreenSession;
};

export function SessionCard({ session }: SessionCardProps) {
  const createdAt = new Date(session.savedAt ?? session.createdAt).toLocaleString();

  return (
    <View className="rounded-[28px] border border-white/10 bg-white/10 p-5">
      <Text className="text-xs font-black uppercase tracking-[1.5px] text-mint">{createdAt}</Text>
      <Text className="mt-2 text-xl font-black text-white">OCR session</Text>
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
      </View>
    </View>
  );
}
