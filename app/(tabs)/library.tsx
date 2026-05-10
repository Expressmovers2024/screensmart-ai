import { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { SessionCard } from "@/components/session";
import { EmptyState, LoadingState, PrimaryButton, RetryState, ScreenCard } from "@/components/ui";
import { routes } from "@/constants/routes";
import { storageService } from "@/services/storage";
import { useSessionStore } from "@/store/sessionStore";
import type { ScreenSession } from "@/types/screenSession";

export default function LibraryRoute() {
  const router = useRouter();
  const setCurrentSession = useSessionStore((state) => state.setCurrentSession);
  const [sessions, setSessions] = useState<ScreenSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      setSessions(await storageService.listScreenSessions());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load saved OCR sessions.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  useFocusEffect(
    useCallback(() => {
      void loadSessions();
    }, [loadSessions])
  );

  const openSession = (session: ScreenSession) => {
    setCurrentSession(session);
    router.push(routes.summary);
  };

  return (
    <ScrollView className="flex-1 bg-ink" contentContainerClassName="px-6 pb-12 pt-14">
      <View className="mb-8">
        <Text className="text-xs font-black uppercase tracking-[2px] text-electric">Library</Text>
        <Text className="mt-3 text-4xl font-black leading-tight text-white">Saved sessions</Text>
        <Text className="mt-4 text-base leading-7 text-slate-300">
          Local-first history for OCR sessions, extracted text, summaries, and future Supabase sync.
        </Text>
      </View>

      <View className="gap-5">
        <ScreenCard eyebrow="History" title={`${sessions.length} saved session${sessions.length === 1 ? "" : "s"}`}>
          {isLoading ? <LoadingState title="Loading library" message="Fetching saved OCR sessions..." /> : null}
          {errorMessage ? <RetryState title="Could not load library" message={errorMessage} onRetry={loadSessions} /> : null}
          {!isLoading && !errorMessage && sessions.length === 0 ? (
            <EmptyState
              title="No saved sessions"
              message="Save an OCR result to build your ScreenSmart history."
              actionLabel="Upload screenshot"
              onAction={() => router.push(routes.uploadScreenshot)}
            />
          ) : null}
          {!isLoading && !errorMessage
            ? sessions.map((session) => <SessionCard key={session.id} session={session} onPress={() => openSession(session)} />)
            : null}
          <PrimaryButton label="Refresh library" onPress={loadSessions} variant="secondary" />
        </ScreenCard>
      </View>
    </ScrollView>
  );
}
