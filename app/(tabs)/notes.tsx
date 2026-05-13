import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";

import { EmptyState, LoadingState, PrimaryButton, RetryState, ScreenCard } from "@/components/ui";
import { useCurrentSession } from "@/hooks/useCurrentSession";
import { storageService, type Note } from "@/services/storage";
import { createId } from "@/utils/createId";

export default function NotesRoute() {
  const currentSession = useCurrentSession();
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      setNotes(await storageService.listNotes());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load your notes.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadNotes(); }, [loadNotes]);

  const saveNote = async () => {
    if (!body.trim()) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const note = await storageService.saveNote({
        id: createId("note"),
        body: body.trim(),
        sessionId: currentSession?.id ?? null,
        title: title.trim() || "Screen note"
      });
      setNotes((cur) => [note, ...cur]);
      setBody("");
      setTitle("");
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? `Could not save note: ${err.message}`
          : "Could not save your note. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-ink" contentContainerClassName="px-6 pb-12 pt-14">
      {/* Header */}
      <View className="mb-8">
        <Text className="text-xs font-black uppercase tracking-[2px] text-electric">Notes</Text>
        <Text className="mt-3 text-4xl font-black leading-tight text-white">Capture thoughts</Text>
        <Text className="mt-4 text-base leading-7 text-slate-300">
          Write down what you noticed, what to follow up on, or what confused you.
          Notes are saved privately on your device.
          {currentSession ? " This note will link to your current screen session." : ""}
        </Text>
      </View>

      <View className="gap-5">
        {/* Note composer */}
        <ScreenCard
          eyebrow={currentSession ? "Linked to session" : "New note"}
          title={currentSession ? (currentSession.title ?? "Current screen") : "Write a note"}
        >
          <TextInput
            accessibilityLabel="Note title"
            className="min-h-14 rounded-2xl border border-white/10 bg-white/10 px-4 text-base text-white"
            onChangeText={setTitle}
            placeholder="Title (optional)"
            placeholderTextColor="#64748B"
            value={title}
          />
          <TextInput
            accessibilityLabel="Note body"
            className="min-h-32 rounded-3xl border border-white/10 bg-white/10 px-4 py-4 text-base leading-6 text-white"
            multiline
            onChangeText={setBody}
            placeholder="What did you notice? What do you need to follow up on?"
            placeholderTextColor="#64748B"
            textAlignVertical="top"
            value={body}
          />
          {saveError && (
            <View className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3">
              <Text className="text-sm text-red-300">{saveError}</Text>
            </View>
          )}
          <PrimaryButton
            disabled={!body.trim() || isSaving}
            label={isSaving ? "Saving..." : "Save note"}
            onPress={() => void saveNote()}
          />
        </ScreenCard>

        {/* Notes list */}
        <ScreenCard
          eyebrow="Saved notes"
          title={notes.length > 0 ? `${notes.length} note${notes.length === 1 ? "" : "s"}` : "Your notes"}
        >
          {isLoading && (
            <LoadingState title="Loading notes" message="Fetching your saved notes..." />
          )}
          {errorMessage && (
            <RetryState
              title="Could not load notes"
              message={errorMessage}
              onRetry={loadNotes}
            />
          )}
          {!isLoading && !errorMessage && notes.length === 0 && (
            <EmptyState
              emoji="✏️"
              title="No notes yet"
              message="Write a thought, reminder, or observation. Notes can link to the screen session you're reviewing."
            />
          )}
          {!isLoading && !errorMessage &&
            notes.map((note) => (
              <View
                className="rounded-[28px] border border-white/10 bg-white/5 p-5"
                key={note.id}
              >
                <Text className="text-xs font-black uppercase tracking-[1.5px] text-mint">
                  {formatDate(note.updatedAt)}
                </Text>
                <Text className="mt-2 text-base font-black text-white">{note.title}</Text>
                <Text className="mt-2 text-sm leading-6 text-slate-300">{note.body}</Text>
              </View>
            ))}
        </ScreenCard>
      </View>
    </ScrollView>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
