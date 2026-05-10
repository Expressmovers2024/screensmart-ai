import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import type { Navigate, ScreenKey } from "../types/navigation";

const tabs: Array<{ key: ScreenKey; label: string }> = [
  { key: "home", label: "Home" },
  { key: "upload", label: "Upload" },
  { key: "talkback", label: "Chat" },
  { key: "library", label: "Library" },
  { key: "settings", label: "Settings" }
];

type BottomNavProps = {
  currentScreen: ScreenKey;
  navigate: Navigate;
};

export function BottomNav({ currentScreen, navigate }: BottomNavProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = tab.key === currentScreen;

        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            key={tab.key}
            onPress={() => navigate(tab.key)}
            style={[styles.tab, active && styles.activeTab]}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  activeLabel: {
    color: colors.surface
  },
  activeTab: {
    backgroundColor: colors.primary
  },
  container: {
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "space-between"
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: "800"
  },
  tab: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm
  }
});
