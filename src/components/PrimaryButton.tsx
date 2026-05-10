import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  icon?: ReactNode;
  style?: ViewStyle;
};

export function PrimaryButton({
  label,
  onPress,
  variant = "primary",
  icon,
  style
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        style
      ]}
    >
      {icon}
      <Text style={[styles.label, variant !== "primary" && styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: 18,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  ghost: {
    backgroundColor: "transparent"
  },
  label: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: "700"
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }]
  },
  primary: {
    backgroundColor: colors.primary
  },
  secondary: {
    backgroundColor: colors.surfaceMuted
  },
  secondaryLabel: {
    color: colors.text
  }
});
