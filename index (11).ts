import { Pressable, Text } from "react-native";

type ResearchFollowUpButtonProps = {
  question: string;
  onPress: (question: string) => void;
};

export function ResearchFollowUpButton({ question, onPress }: ResearchFollowUpButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Follow-up research: ${question}`}
      className="active:opacity-70"
      onPress={() => onPress(question)}
    >
      <Text className="rounded-2xl border border-electric/30 bg-electric/10 px-4 py-3 text-sm font-bold leading-5 text-electric">
        {question}
      </Text>
    </Pressable>
  );
}
