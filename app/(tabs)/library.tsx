import { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { SessionCard } from "@/components/session";
import { EmptyState, LoadingState, PrimaryButton, RetryState, ScreenCard } from "@/components/ui";
import { routes } from "@/constants/routes";
import { storageService } from "@/services/storage";
import { useSessionStore } from "@/store/sessionStore";
import type { ScreenSession } from "@/types/screenSession";
import { createDemoSession, DEMO_SESSION_ID } from "@/utils/demoSession";

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
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load your saved sessions."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadSessions(); }, [loadSessions]);
  useFocusEffect(useCallback(() => { void loadSessions(); }, [loadSessions]));

  const openSession = (session: ScreenSession) => {
    setCurrentSession(session);
    router.push(routes.summary);
  };

  const openDemo = () => {
    setCurrentSession(createDemoSession());
    router.push(routes.summary);
  };

  const userSessions = sessions.filter((s) => s.id !== DEMO_SESSION_ID);

  return (
    <ScrollView className="flex-1 bg-ink" contentContainerClassName="px-6 pb-12 pt-14">
      {/* Header */}
      <View className="mb-8">
        <Text className="text-xs font-black uppercase tracking-[2px] text-electric">Library</Text>
        <Text className="mt-3 text-4xl font-black leading-tight text-white">Your saved screens</Text>
        <Text className="mt-4 text-base leading-7 text-slate-300">
          Every screenshot you scan is saved here. Tap any session to re-read the summary,
          ask follow-up questions, or continue a mission.
        </Text>
      </View>

      <View className="gap-5">
        {/* Demo card — always shown at top */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open demo session — bank statement example"
          className="active:opacity-70"
          onPress={openDemo}
        >
          <View className="rounded-[32px] border border-electric/20 bg-electric/5 p-5">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs font-black uppercase tracking-[1.5px] text-electric">
                  Try the demo
                </Text>
                <Text className="mt-1 text-lg font-black text-white">
                  Bank Statement Example
                </Text>
                <Text className="mt-0.5 text-xs text-slate-400">
                  See the full ScreenSmart experience without uploading anything
                </Text>
              </View>
              <Text className="text-3xl">🏦</Text>
            </View>
          </View>
        </Pressable>

        {/* User sessions */}
        <ScreenCard
          eyebrow="Your sessions"
          title={
            userSessions.length > 0
              ? `${userSessions.length} saved session${userSessions.length === 1 ? "" : "s"}`
              : "Your sessions"
          }
        >
          {isLoading && (
            <LoadingState title="Loading library" message="Fetching your saved sessions..." />
          )}
          {errorMessage && (
            <RetryState
              title="Could not load library"
              message={errorMessage}
              onRetry={loadSessions}
            />
          )}
          {!isLoading && !errorMessage && userSessions.length === 0 && (
            <EmptyState
              emoji="📂"
              title="No saved sessions yet"
              message="Scan a screenshot and it will be saved here automatically. Your history is stored locally and stays private."
              actionLabel="Scan your first screenshot"
              onAction={() => router.push(routes.uploadScreenshot)}
            />
          )}
          {!isLoading && !errorMessage
            ? userSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onPress={() => openSession(session)}
                />
              ))
            : null}
          {userSessions.length > 0 && (
            <PrimaryButton label="Refresh" onPress={loadSessions} variant="secondary" />
          )}
        </ScreenCard>
      </View>
    </ScrollView>
  );
}
