import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { AgentActivityFeed, MissionCard, SuggestedMissionCard } from "@/components/mission";
import { EmptyState, LoadingState, PrimaryButton, RetryState, ScreenCard } from "@/components/ui";
import { routes } from "@/constants/routes";
import { storageService, type Mission } from "@/services/storage";
import { MissionPlannerAgent, OrchestratorAgent, type AgentRun, type WorkflowCheckpoint } from "@/src/agents";
import { useSessionStore } from "@/store/sessionStore";
import type { ScreenSession } from "@/types/screenSession";

const orchestratorAgent = new OrchestratorAgent();
const missionPlannerAgent = new MissionPlannerAgent();

export default function MissionControlRoute() {
  const router = useRouter();
  const setCurrentSession = useSessionStore((state) => state.setCurrentSession);
  const [sessions, setSessions] = useState<ScreenSession[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadMissionControl = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [nextSessions, nextMissions] = await Promise.all([
        storageService.listScreenSessions(),
        storageService.listMissions()
      ]);
      setSessions(nextSessions);
      setMissions(nextMissions);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load Mission Control."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void loadMissionControl(); }, [loadMissionControl]));

  const activeSessions = sessions.filter((s) =>
    (s.workflowCheckpoints ?? []).some((c) => c.status === "open")
  );
  const recentCheckpoints = sessions
    .flatMap((s) => s.workflowCheckpoints ?? [])
    .slice(0, 8);
  const agentRuns = sessions.flatMap((s) => s.agentRuns ?? []).slice(0, 12);
  const suggestedSessions = sessions.filter(
    (s) => !missions.some((m) => m.sessionIds.includes(s.id))
  );

  const openSession = (session: ScreenSession) => {
    setCurrentSession(session);
    router.push(routes.ocrResult);
  };

  const createMission = async (session: ScreenSession) => {
    const plan = await orchestratorAgent.continueTask(session);
    const result = await missionPlannerAgent.execute(
      { checkpoint: plan.checkpoint, session },
      { sessionId: session.id }
    );
    setMissions((cur) => [
      result.output.mission,
      ...cur.filter((m) => m.id !== result.output.mission.id)
    ]);
  };

  const continueMission = (mission: Mission) => {
    const session = sessions.find((s) => mission.sessionIds.includes(s.id));
    if (session) { openSession(session); return; }
    router.push(routes.uploadScreenshot);
  };

  const isEmpty = !isLoading && !errorMessage && sessions.length === 0 && missions.length === 0;

  return (
    <ScrollView className="flex-1 bg-ink" contentContainerClassName="px-6 pb-12 pt-14">
      {/* Header */}
      <View className="mb-8">
        <Text className="text-xs font-black uppercase tracking-[2px] text-electric">
          Mission Control
        </Text>
        <Text className="mt-3 text-4xl font-black leading-tight text-white">
          Your AI workflows
        </Text>
        <Text className="mt-4 text-base leading-7 text-slate-300">
          ScreenSmart saves your work as missions — each one tracks the screens,
          checkpoints, and next steps for a task you care about.
        </Text>
      </View>

      <View className="gap-5">
        {isLoading && (
          <LoadingState
            title="Loading missions"
            message="Collecting your sessions, missions, and agent activity..."
          />
        )}
        {errorMessage && (
          <RetryState
            title="Could not load missions"
            message={errorMessage}
            onRetry={loadMissionControl}
          />
        )}

        {isEmpty && (
          <EmptyState
            emoji="🎯"
            title="No missions yet"
            message="Scan a screenshot, then tap Continue This Task on the result screen. ScreenSmart will create a mission with checkpoints and next steps automatically."
            actionLabel="Scan a screenshot"
            onAction={() => router.push(routes.uploadScreenshot)}
          />
        )}

        {!isLoading && !errorMessage && !isEmpty && (
          <>
            {/* Active workflows */}
            {activeSessions.length > 0 && (
              <ScreenCard
                eyebrow="Active workflows"
                title={`${activeSessions.length} open`}
              >
                <View className="gap-2">
                  {activeSessions.slice(0, 4).map((session) => (
                    <PrimaryButton
                      key={session.id}
                      label={session.title ?? "Open active session"}
                      onPress={() => openSession(session)}
                      variant="secondary"
                    />
                  ))}
                </View>
              </ScreenCard>
            )}

            {/* Checkpoints */}
            {recentCheckpoints.length > 0 && (
              <ScreenCard
                eyebrow="Checkpoints"
                title={`${recentCheckpoints.length} saved`}
              >
                <View className="gap-3">
                  {recentCheckpoints.map((cp: WorkflowCheckpoint) => (
                    <View
                      className="rounded-3xl border border-white/10 bg-white/5 p-4"
                      key={cp.id}
                    >
                      <Text className="text-sm font-black text-white">{cp.title}</Text>
                      <Text className="mt-1 text-xs leading-5 text-slate-400">
                        {cp.description}
                      </Text>
                      <Text className="mt-2 text-xs font-black uppercase tracking-[1px] text-slate-600">
                        {cp.status}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScreenCard>
            )}

            {/* Agent activity feed */}
            <AgentActivityFeed
              agentRuns={agentRuns as AgentRun[]}
              checkpoints={recentCheckpoints}
              missions={missions}
            />

            {/* Saved missions */}
            {missions.slice(0, 4).map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onContinue={() => continueMission(mission)}
              />
            ))}

            {/* Suggested missions */}
            {suggestedSessions.slice(0, 3).map((session) => (
              <SuggestedMissionCard
                key={session.id}
                session={session}
                onCreateMission={() => void createMission(session)}
              />
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}
