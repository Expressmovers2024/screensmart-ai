import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../../theme/tokens";

type ScreenSectionProps = {
  items: string[];
};

export function ScreenSection({ items }: ScreenSectionProps) {
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item} style={styles.row}>
          <View style={styles.dot} />
          <Text style={styles.text}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    height: 10,
    marginTop: 7,
    width: 10
  },
  list: {
    gap: spacing.sm
  },
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm
  },
  text: {
    color: colors.textMuted,
    flex: 1,
    fontSize: typography.body,
    lineHeight: 24
  }
});
