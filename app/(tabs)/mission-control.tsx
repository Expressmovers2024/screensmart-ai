import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { AgentActivityFeed, MissionCard, SuggestedMissionCard } from "@/components/mission";
import { EmptyState, LoadingState, PrimaryButton, RetryState, ScreenCard } from "@/components/ui";
import { routes } from "@/constants/routes";
import { storageService, type Mission } from "@/services/storage";
import { MissionPlannerAgent, OrchestratorAgent } from "@/src/agents";
import type { AgentRun, WorkflowCheckpoint } from "@/src/agents";
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
      setErrorMessage(error instanceof Error ? error.message : "Unable to load Mission Control.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadMissionControl();
    }, [loadMissionControl])
  );

  const activeSessions = sessions.filter((session) => (session.workflowCheckpoints ?? []).some((checkpoint) => checkpoint.status === "open"));
  const recentCheckpoints = sessions.flatMap((session) => session.workflowCheckpoints ?? []).slice(0, 8);
  const agentRuns = sessions.flatMap((session) => session.agentRuns ?? []).slice(0, 12);
  const suggestedMissionSessions = sessions.filter(
    (session) => !missions.some((mission) => mission.sessionIds.includes(session.id))
  );

  const openSession = (session: ScreenSession) => {
    setCurrentSession(session);
    router.push(routes.ocrResult);
  };

  const createMissionFromSession = async (session: ScreenSession) => {
    const plan = await orchestratorAgent.continueTask(session);
    const missionResult = await missionPlannerAgent.execute(
      {
        checkpoint: plan.checkpoint,
        session
      },
      { sessionId: session.id }
    );

    setMissions((current) => [missionResult.output.mission, ...current.filter((mission) => mission.id !== missionResult.output.mission.id)]);
  };

  const continueMission = (mission: Mission) => {
    const session = sessions.find((item) => mission.sessionIds.includes(item.id));

    if (session) {
      openSession(session);
      return;
    }

    router.push(routes.uploadScreenshot);
  };

  return (
    <ScrollView className="flex-1 bg-ink" contentContainerClassName="px-6 pb-12 pt-14">
      <View className="mb-8">
        <Text className="text-xs font-black uppercase tracking-[2px] text-electric">Mission Control</Text>
        <Text className="mt-3 text-4xl font-black leading-tight text-white">AI workflow command center</Text>
        <Text className="mt-4 text-base leading-7 text-slate-300">
          Track active sessions, workflow checkpoints, agent activity, saved screens, and suggested missions.
        </Text>
      </View>

      <View className="gap-5">
        {isLoading ? <LoadingState title="Loading Mission Control" message="Collecting sessions, missions, and agent activity..." /> : null}
        {errorMessage ? <RetryState title="Mission Control unavailable" message={errorMessage} onRetry={loadMissionControl} /> : null}

        {!isLoading && !errorMessage ? (
          <>
            <ScreenCard eyebrow="Active sessions" title={`${activeSessions.length} active workflow${activeSessions.length === 1 ? "" : "s"}`}>
              {activeSessions.length === 0 ? (
                <EmptyState
                  title="No active sessions"
                  message="Upload a screenshot and tap Continue This Task to create checkpoints."
                  actionLabel="Upload screenshot"
                  onAction={() => router.push(routes.uploadScreenshot)}
                />
              ) : null}
              <View className="gap-3">
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

            <ScreenCard eyebrow="Recent checkpoints" title={`${recentCheckpoints.length} checkpoint${recentCheckpoints.length === 1 ? "" : "s"}`}>
              <View className="gap-3">
                {recentCheckpoints.length === 0 ? (
                  <Text className="text-base leading-7 text-slate-300">Workflow checkpoints will appear after Continue This Task is used.</Text>
                ) : null}
                {recentCheckpoints.map((checkpoint: WorkflowCheckpoint) => (
                  <View className="rounded-3xl border border-white/10 bg-white/5 p-4" key={checkpoint.id}>
                    <Text className="text-lg font-black text-white">{checkpoint.title}</Text>
                    <Text className="mt-2 text-base leading-6 text-slate-300">{checkpoint.description}</Text>
                    <Text className="mt-2 text-xs font-black uppercase tracking-[1.5px] text-slate-500">{checkpoint.status}</Text>
                  </View>
                ))}
              </View>
            </ScreenCard>

            <AgentActivityFeed agentRuns={agentRuns as AgentRun[]} checkpoints={recentCheckpoints} missions={missions} />

            <ScreenCard eyebrow="Saved screens" title={`${sessions.length} saved screen${sessions.length === 1 ? "" : "s"}`}>
              <View className="gap-3">
                {sessions.slice(0, 5).map((session) => (
                  <PrimaryButton
                    key={session.id}
                    label={session.title ?? "Open saved screen"}
                    onPress={() => openSession(session)}
                    variant="secondary"
                  />
                ))}
              </View>
            </ScreenCard>

            {missions.slice(0, 4).map((mission) => (
              <MissionCard key={mission.id} mission={mission} onContinue={() => continueMission(mission)} />
            ))}

            {suggestedMissionSessions.slice(0, 3).map((session) => (
              <SuggestedMissionCard key={session.id} session={session} onCreateMission={() => createMissionFromSession(session)} />
            ))}
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}
