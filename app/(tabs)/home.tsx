import { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { RecentActivityCard } from "@/components/session";
import { EmptyState, LoadingState, PrimaryButton, RetryState, ScreenCard } from "@/components/ui";
import { routes } from "@/constants/routes";
import { storageService, type RecentActivity } from "@/services/storage";
import { useSessionStore } from "@/store/sessionStore";

export default function HomeRoute() {
  const router = useRouter();
  const setCurrentSession = useSessionStore((state) => state.setCurrentSession);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRecentActivity = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      setRecentActivity(await storageService.listRecentActivity());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load recent activity.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecentActivity();
  }, [loadRecentActivity]);

  useFocusEffect(
    useCallback(() => {
      void loadRecentActivity();
    }, [loadRecentActivity])
  );

  const openActivity = (activity: RecentActivity) => {
    if (activity.type === "screen_session") {
      setCurrentSession(activity.session);
      router.push(routes.summary);
      return;
    }

    if (activity.type === "note") {
      router.push(routes.notes);
      return;
    }

    router.push(routes.audioReader);
  };

  return (
    <ScrollView className="flex-1 bg-ink" contentContainerClassName="px-6 pb-12 pt-14">
      <View className="mb-8">
        <Text className="text-xs font-black uppercase tracking-[2px] text-electric">Dashboard</Text>
        <Text className="mt-3 text-4xl font-black leading-tight text-white">ScreenSmart AI</Text>
        <Text className="mt-4 text-base leading-7 text-slate-300">
          Upload screens, review OCR history, continue chats, and revisit notes from local-first storage.
        </Text>
      </View>

      <View className="gap-5">
        <ScreenCard eyebrow="Start" title="Analyze a screen">
          <Text className="text-base leading-7 text-slate-300">
            Capture a screenshot from your device gallery and save the OCR session for later.
          </Text>
          <PrimaryButton label="Upload screenshot" onPress={() => router.push(routes.uploadScreenshot)} />
        </ScreenCard>

        <ScreenCard eyebrow="Recent activity" title="Latest saved work">
          {isLoading ? <LoadingState title="Loading activity" message="Checking local storage and Supabase-ready records..." /> : null}
          {errorMessage ? <RetryState title="Could not load activity" message={errorMessage} onRetry={loadRecentActivity} /> : null}
          {!isLoading && !errorMessage && recentActivity.length === 0 ? (
            <EmptyState
              title="No activity yet"
              message="Saved OCR sessions, notes, TalkBack messages, and audio playback events will appear here."
              actionLabel="Upload first screenshot"
              onAction={() => router.push(routes.uploadScreenshot)}
            />
          ) : null}
          {!isLoading && !errorMessage
            ? recentActivity
                .slice(0, 6)
                .map((activity) => (
                  <RecentActivityCard activity={activity} key={`${activity.type}-${activity.id}`} onPress={() => openActivity(activity)} />
                ))
            : null}
        </ScreenCard>
      </View>
    </ScrollView>
  );
}
