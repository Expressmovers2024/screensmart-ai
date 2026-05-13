import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  icon?: ReactNode;
};

const variants = {
  primary: "bg-electric",
  secondary: "bg-white/10 border border-white/10",
  ghost: "bg-transparent"
} as const;

const labelVariants = {
  primary: "text-ink",
  secondary: "text-white",
  ghost: "text-electric"
} as const;

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  variant = "primary",
  icon
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={`min-h-14 flex-row items-center justify-center gap-2 rounded-2xl px-6 py-4 ${variants[variant]} ${
        disabled ? "opacity-50" : "active:opacity-80"
      }`}
      disabled={disabled}
      onPress={onPress}
    >
      {icon ? <View>{icon}</View> : null}
      <Text className={`text-center text-base font-black ${labelVariants[variant]}`}>{label}</Text>
    </Pressable>
  );
}
