import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { colors, radius, spacing, typography } from "../../theme/tokens";

type AppButtonProps = {
  label: string;
  href?: Href;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  style?: ViewStyle;
};

export function AppButton({ label, href, onPress, variant = "primary", style }: AppButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    if (href) {
      router.push(href);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      style={({ pressed }) => [styles.button, styles[variant], pressed && styles.pressed, style]}
    >
      <Text style={[styles.label, variant !== "primary" && styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: radius.lg,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  ghost: {
    backgroundColor: "transparent"
  },
  label: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: "800"
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }]
  },
  primary: {
    backgroundColor: colors.primary
  },
  secondary: {
    backgroundColor: colors.surfaceSoft
  },
  secondaryLabel: {
    color: colors.text
  }
});
