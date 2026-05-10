import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../../theme/tokens";

type CardProps = {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
};

export function Card({ title, eyebrow, children }: CardProps) {
  return (
    <View style={styles.card}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    shadowColor: colors.text,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 22
  },
  eyebrow: {
    color: colors.accent,
    fontSize: typography.caption,
    fontWeight: "900",
    letterSpacing: 0.9,
    marginBottom: spacing.xs,
    textTransform: "uppercase"
  },
  title: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "900",
    marginBottom: spacing.md
  }
});
