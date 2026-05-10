import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppShell } from "../components/AppShell";
import { PrimaryButton } from "../components/PrimaryButton";
import { SectionCard } from "../components/SectionCard";
import { supabaseService } from "../services";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import type { LibraryItem } from "../types/content";
import type { Navigate } from "../types/navigation";

type LibraryScreenProps = {
  navigate: Navigate;
};

export function LibraryScreen({ navigate }: LibraryScreenProps) {
  const [items, setItems] = useState<LibraryItem[]>([]);

  useEffect(() => {
    supabaseService.getLibrary().then(setItems);
  }, []);

  return (
    <AppShell
      title="Library"
      subtitle="Saved scans will live here once Supabase auth and persistence are connected."
    >
      {items.map((item) => (
        <SectionCard key={item.id} eyebrow={item.createdAt} title={item.title}>
          <Text style={styles.summary}>{item.summary}</Text>
          <View style={styles.tags}>
            {item.tags.map((tag) => (
              <Text key={tag} style={styles.tag}>
                {tag}
              </Text>
            ))}
          </View>
        </SectionCard>
      ))}

      <PrimaryButton label="Scan another screenshot" onPress={() => navigate("upload")} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  summary: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  },
  tag: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});
