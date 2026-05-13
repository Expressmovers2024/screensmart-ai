import { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { GetStartedCard } from "@/components/home";
import { RecentActivityCard } from "@/components/session";
import { EmptyState, LoadingState, PrimaryButton, RetryState, ScreenCard } from "@/components/ui";
import { routes } from "@/constants/routes";
import { storageService, type RecentActivity } from "@/services/storage";
import { useSessionStore } from "@/store/sessionStore";
import { createDemoSession } from "@/utils/demoSession";

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

  useEffect(() => { void loadRecentActivity(); }, [loadRecentActivity]);
  useFocusEffect(useCallback(() => { void loadRecentActivity(); }, [loadRecentActivity]));

  const openActivity = (activity: RecentActivity) => {
    if (activity.type === "screen_session") {
      setCurrentSession(activity.session);
      router.push(routes.summary);
      return;
    }
    if (activity.type === "note") { router.push(routes.notes); return; }
    router.push(routes.audioReader);
  };

  const openDemo = () => {
    setCurrentSession(createDemoSession());
    router.push(routes.summary);
  };

  return (
    <ScrollView className="flex-1 bg-ink" contentContainerClassName="px-6 pb-12 pt-14">
      {/* Header */}
      <View className="mb-8">
        <Text className="text-xs font-black uppercase tracking-[2px] text-electric">
          ScreenSmart AI
        </Text>
        <Text className="mt-3 text-4xl font-black leading-tight text-white">
          What's on your screen?
        </Text>
        <Text className="mt-4 text-base leading-7 text-slate-300">
          Upload a screenshot and ScreenSmart reads it, explains it, and suggests what to do next.
          Free when local. Paid when we run the cloud.
        </Text>
      </View>

      <View className="gap-5">
        {/* Primary action */}
        <ScreenCard eyebrow="Start here" title="Analyse a screenshot">
          <Text className="text-sm leading-6 text-slate-300">
            Choose any screenshot from your gallery — a bill, an error message, an email, a tutorial.
            ScreenSmart turns it into summaries, notes, and next steps.
          </Text>
          <PrimaryButton
            label="Upload screenshot"
            onPress={() => router.push(routes.uploadScreenshot)}
          />
          <PrimaryButton
            label="Try the demo →"
            onPress={openDemo}
            variant="ghost"
          />
        </ScreenCard>

        {/* Get started checklist */}
        <GetStartedCard />

        {/* Recent activity */}
        <ScreenCard eyebrow="Recent activity" title="Your saved work">
          {isLoading && (
            <LoadingState title="Loading activity" message="Checking your saved sessions and notes..." />
          )}
          {errorMessage && (
            <RetryState
              title="Could not load activity"
              message={errorMessage}
              onRetry={loadRecentActivity}
            />
          )}
          {!isLoading && !errorMessage && recentActivity.length === 0 && (
            <EmptyState
              emoji="🗂️"
              title="Nothing saved yet"
              message="Your sessions, notes, and missions will appear here once you start scanning screenshots."
              actionLabel="Scan your first screenshot"
              onAction={() => router.push(routes.uploadScreenshot)}
              secondaryLabel="Try the demo"
              onSecondaryAction={openDemo}
            />
          )}
          {!isLoading && !errorMessage
            ? recentActivity.slice(0, 6).map((activity) => (
                <RecentActivityCard
                  activity={activity}
                  key={`${activity.type}-${activity.id}`}
                  onPress={() => openActivity(activity)}
                />
              ))
            : null}
        </ScreenCard>
      </View>
    </ScrollView>
  );
}
