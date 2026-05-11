import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";

import { EmptyState, LoadingState, PrimaryButton, RetryState, ScreenCard } from "@/components/ui";
import { useCurrentSession } from "@/hooks/useCurrentSession";
import { storageService, type Note } from "@/services/storage";
import { createId } from "@/utils/createId";

export default function NotesRoute() {
  const currentSession = useCurrentSession();
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("Screen note");
  const [body, setBody] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      setNotes(await storageService.listNotes());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load notes.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const saveNote = async () => {
    if (!body.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      const note = await storageService.saveNote({
        id: createId("note"),
        body: body.trim(),
        sessionId: currentSession?.id ?? null,
        title: title.trim() || "Screen note"
      });

      setNotes((currentNotes) => [note, ...currentNotes]);
      setBody("");
      setTitle("Screen note");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-ink" contentContainerClassName="px-6 pb-12 pt-14">
      <View className="mb-8">
        <Text className="text-xs font-black uppercase tracking-[2px] text-electric">Notes</Text>
        <Text className="mt-3 text-4xl font-black leading-tight text-white">Save thoughts</Text>
        <Text className="mt-4 text-base leading-7 text-slate-300">
          Notes are stored through the storage abstraction and can attach to the current OCR session.
        </Text>
      </View>

      <View className="gap-5">
        <ScreenCard eyebrow="New note" title={currentSession ? "Attach to current session" : "Standalone note"}>
          <TextInput
            accessibilityLabel="Note title"
            className="min-h-14 rounded-2xl border border-white/10 bg-white/10 px-4 text-base text-white"
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor="#94A3B8"
            value={title}
          />
          <TextInput
            accessibilityLabel="Note body"
            className="min-h-32 rounded-3xl border border-white/10 bg-white/10 px-4 py-4 text-base leading-6 text-white"
            multiline
            onChangeText={setBody}
            placeholder="Write a reminder, follow-up, or explanation..."
            placeholderTextColor="#94A3B8"
            textAlignVertical="top"
            value={body}
          />
          <PrimaryButton disabled={!body.trim() || isSaving} label={isSaving ? "Saving..." : "Save note"} onPress={saveNote} />
        </ScreenCard>

        <ScreenCard eyebrow="Saved notes" title={`${notes.length} note${notes.length === 1 ? "" : "s"}`}>
          {isLoading ? <LoadingState title="Loading notes" message="Fetching saved notes..." /> : null}
          {errorMessage ? <RetryState title="Could not load notes" message={errorMessage} onRetry={loadNotes} /> : null}
          {!isLoading && !errorMessage && notes.length === 0 ? (
            <EmptyState title="No notes yet" message="Save notes from OCR sessions, summaries, or TalkBack conversations." />
          ) : null}
          {!isLoading && !errorMessage
            ? notes.map((note) => (
                <View className="rounded-[28px] border border-white/10 bg-white/10 p-5" key={note.id}>
                  <Text className="text-xs font-black uppercase tracking-[1.5px] text-mint">
                    {new Date(note.updatedAt).toLocaleString()}
                  </Text>
                  <Text className="mt-2 text-xl font-black text-white">{note.title}</Text>
                  <Text className="mt-2 text-base leading-7 text-slate-300">{note.body}</Text>
                </View>
              ))
            : null}
        </ScreenCard>
      </View>
    </ScrollView>
  );
}
