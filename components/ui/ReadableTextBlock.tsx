import { Text, View } from "react-native";

type ReadableTextBlockProps = {
  text: string;
};

export function ReadableTextBlock({ text }: ReadableTextBlockProps) {
  return (
    <View className="rounded-3xl border border-white/10 bg-ink/70 p-5">
      <Text className="text-base leading-7 text-slate-100">{text}</Text>
    </View>
  );
}
