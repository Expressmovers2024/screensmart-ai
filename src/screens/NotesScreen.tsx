import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { AppShell } from "../components/AppShell";
import { PrimaryButton } from "../components/PrimaryButton";
import { SectionCard } from "../components/SectionCard";
import { supabaseService } from "../services";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import type { Note } from "../types/content";
import type { Navigate } from "../types/navigation";

type NotesScreenProps = {
  navigate: Navigate;
};

export function NotesScreen({ navigate }: NotesScreenProps) {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    supabaseService.getNotes().then(setNotes);
  }, []);

  return (
    <AppShell
      title="Notes"
      subtitle="Capture follow-ups, reminders, and plain-language explanations from your scans."
    >
      {notes.map((note) => (
        <SectionCard key={note.id} eyebrow={`Updated ${note.updatedAt}`} title={note.title}>
          <Text style={styles.body}>{note.body}</Text>
        </SectionCard>
      ))}

      <PrimaryButton label="Ask TalkBack" onPress={() => navigate("talkback")} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 24
  }
});
