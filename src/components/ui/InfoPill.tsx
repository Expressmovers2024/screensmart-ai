import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../../theme/tokens";

type InfoPillProps = {
  label: string;
  value: string;
};

export function InfoPill({ label, value }: InfoPillProps) {
  return (
    <View style={styles.pill}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  pill: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.lg,
    flex: 1,
    gap: spacing.xs,
    minWidth: 130,
    padding: spacing.md
  },
  value: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: "900"
  }
});
