import { useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { AgentTimelinePanel, ScreenIntelligenceCards, WorkflowCheckpointCard } from "@/components/agents";
import { LoadingState, PrimaryButton, ReadableTextBlock, ScreenCard } from "@/components/ui";
import { routes } from "@/constants/routes";
import { useCurrentSession } from "@/hooks/useCurrentSession";
import { aiService, type AiResponse, type AiTask } from "@/services/ai";
import { storageService, type Mission } from "@/services/storage";
import { MissionPlannerAgent, OrchestratorAgent, type ContinueTaskPlan } from "@/src/agents";
import { useSessionStore } from "@/store/sessionStore";
import type { ScreenSession } from "@/types/screenSession";

const orchestratorAgent = new OrchestratorAgent();
const missionPlannerAgent = new MissionPlannerAgent();

type GenerationAction = {
  label: string;
  task: AiTask;
};

const generationActions: GenerationAction[] = [
  { label: "Generate Short Summary", task: "short_summary" },
  { label: "Generate Detailed Summary", task: "detailed_summary" },
  { label: "Generate Bullet Key Points", task: "key_points" },
  { label: "Explain OCR Text", task: "explain" }
];

export default function SummaryRoute() {
  const router = useRouter();
  const currentSession = useCurrentSession();
  const updateCurrentSession = useSessionStore((state) => state.updateCurrentSession);
  const saveCurrentSessionToLibrary = useSessionStore((state) => state.saveCurrentSessionToLibrary);
  const session = currentSession;
  const [response, setResponse] = useState<AiResponse | null>(
    currentSession?.summary
      ? {
          id: `${currentSession.id}-saved-summary`,
          content: currentSession.summary,
          createdAt: currentSession.savedAt ?? currentSession.createdAt,
          format: "markdown",
          model: "saved-session",
          provider: "placeholder",
          streamed: false,
          task: "short_summary",
          usage: { estimated: true }
        }
      : null
  );
  const [activeTask, setActiveTask] = useState<AiTask | null>(null);
  const [lastTask, setLastTask] = useState<AiTask>("short_summary");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Save session");
  const [continuePlan, setContinuePlan] = useState<ContinueTaskPlan | null>(null);
  const [mission, setMission] = useState<Mission | null>(null);

  const generate = async (task: AiTask) => {
    if (!session?.ocr) {
      setErrorMessage("Upload and scan a screenshot before generating an AI summary.");
      return;
    }

    setActiveTask(task);
    setLastTask(task);
    setErrorMessage(null);

    try {
      const nextResponse = await runTask(task, session);

      setResponse(nextResponse);
      if (task === "short_summary" || task === "detailed_summary") {
        const updatedSession = {
          ...session,
          summary: nextResponse.content
        };

        updateCurrentSession({ summary: nextResponse.content });
        void storageService.saveScreenSession({
          ...updatedSession,
          savedAt: updatedSession.savedAt ?? new Date().toISOString()
        });
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "AI generation failed.");
    } finally {
      setActiveTask(null);
    }
  };

  const saveToLibrary = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const savedSession = saveCurrentSessionToLibrary();

      if (!savedSession) {
        throw new Error("No active OCR session is available to save.");
      }

      await storageService.saveScreenSession(savedSession);
      setSaveStatus("Saved locally");
    } catch (error) {
      setSaveStatus("Retry save");
      setErrorMessage(error instanceof Error ? error.message : "Unable to save this session.");
    } finally {
      setIsSaving(false);
    }
  };

  const continueTask = async () => {
    if (!session) {
      return;
    }

    const plan = await orchestratorAgent.continueTask(session);
    const workflowCheckpoints = [plan.checkpoint, ...(session.workflowCheckpoints ?? [])];
    const lastActiveAt = new Date().toISOString();
    const existingMission = (await storageService.listMissions()).find((item) => item.sessionIds.includes(session.id));
    const missionResult = await missionPlannerAgent.execute(
      {
        checkpoint: plan.checkpoint,
        existingMission,
        session: {
          ...session,
          workflowCheckpoints
        }
      },
      {
        sessionId: session.id
      }
    );

    setContinuePlan(plan);
    setMission(missionResult.output.mission);
    updateCurrentSession({ lastActiveAt, workflowCheckpoints });
    void storageService.saveScreenSession({
      ...session,
      lastActiveAt,
      workflowCheckpoints
    });
  };

  const handleSuggestedAction = (action: string) => {
    const normalized = action.toLowerCase();

    if (normalized.includes("follow-up") || normalized.includes("talkback")) {
      router.push(routes.talkbackChat);
      return;
    }

    if (normalized.includes("notes")) {
      router.push(routes.notes);
      return;
    }

    if (normalized.includes("save")) {
      void saveToLibrary();
      return;
    }

    if (normalized.includes("continue") || normalized.includes("research")) {
      void continueTask();
      return;
    }

    void generate(normalized.includes("explain") ? "explain" : "short_summary");
  };

  if (!session?.ocr) {
    return (
      <ScrollView className="flex-1 bg-ink" contentContainerClassName="px-6 pb-12 pt-14">
        <View className="mb-8">
          <Text className="text-xs font-black uppercase tracking-[2px] text-electric">AI summary</Text>
          <Text className="mt-3 text-4xl font-black leading-tight text-white">Scan a screen first</Text>
          <Text className="mt-4 text-base leading-7 text-slate-300">
            ScreenSmart needs OCR text before it can generate a summary, audio, or TalkBack follow-up.
          </Text>
        </View>
        <ScreenCard title="Start the MVP flow">
          <PrimaryButton label="Upload screenshot" onPress={() => router.push(routes.uploadScreenshot)} />
        </ScreenCard>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-ink" contentContainerClassName="px-6 pb-12 pt-14">
      <View className="mb-8">
        <Text className="text-xs font-black uppercase tracking-[2px] text-electric">AI summary</Text>
        <Text className="mt-3 text-4xl font-black leading-tight text-white">Understand this screen</Text>
        <Text className="mt-4 text-base leading-7 text-slate-300">
          Generate AI summaries and explanations grounded in the current OCR session. OpenRouter is used when configured,
          with a safe placeholder fallback.
        </Text>
      </View>

      <View className="gap-5">
        <ScreenCard eyebrow="OCR grounding" title="Source text">
          <ReadableTextBlock text={session.ocr?.extractedText ?? "No OCR text available."} />
        </ScreenCard>

        <ScreenIntelligenceCards
          intelligence={session.screenIntelligence}
          onActionPress={handleSuggestedAction}
          onContinue={continueTask}
        />

        <WorkflowCheckpointCard
          checkpoints={session.workflowCheckpoints}
          mission={mission}
          plan={continuePlan}
          onActionPress={handleSuggestedAction}
          onContinue={continueTask}
        />

        <ScreenCard eyebrow="Generate" title="AI actions">
          {generationActions.map((action) => (
            <PrimaryButton
              disabled={activeTask !== null}
              key={action.task}
              label={action.label}
              onPress={() => generate(action.task)}
              variant={action.task === "short_summary" ? "primary" : "secondary"}
            />
          ))}
        </ScreenCard>

        {activeTask ? (
          <LoadingState
            title="ScreenSmart is thinking"
            message="Generating an AI response grounded in OCR text..."
          />
        ) : null}

        {errorMessage ? (
          <ScreenCard eyebrow="AI error" title="Generation failed">
            <Text className="text-base leading-7 text-red-100">{errorMessage}</Text>
            <PrimaryButton label="Retry generation" onPress={() => generate(lastTask)} />
          </ScreenCard>
        ) : null}

        {response?.fallbackUsed ? (
          <ScreenCard eyebrow="AI proxy fallback" title="Using mock AI response">
            <Text className="text-base leading-7 text-amber-100">
              The Supabase AI proxy was unavailable or returned an error, so ScreenSmart showed the mock fallback response.
              Check `EXPO_PUBLIC_AI_PROXY_URL`, the deployed function, and the server-side `OPENROUTER_API_KEY`, then retry.
            </Text>
            <PrimaryButton label="Retry through AI proxy" onPress={() => generate(lastTask)} />
          </ScreenCard>
        ) : null}

        <ScreenCard eyebrow="Markdown-safe preview" title="AI response">
          <ReadableTextBlock text={response?.content ?? "Choose an AI action to generate a response."} />
          {response ? (
            <Text className="text-xs font-black uppercase tracking-[1.5px] text-slate-400">
              {response.provider} • {response.model} • tokens{" "}
              {response.usage.totalTokens ?? "pending"} {response.fallbackUsed ? "• fallback" : ""}
            </Text>
          ) : null}
          <PrimaryButton disabled={!response || activeTask !== null} label="Retry generation" onPress={() => generate(lastTask)} variant="secondary" />
          <PrimaryButton disabled={!response || activeTask !== null} label="Listen to summary" onPress={() => router.push(routes.audioReader)} />
          <PrimaryButton disabled={activeTask !== null} label="Ask TalkBack follow-up" onPress={() => router.push(routes.talkbackChat)} variant="ghost" />
          <PrimaryButton disabled={isSaving} label={isSaving ? "Saving..." : saveStatus} onPress={saveToLibrary} variant="secondary" />
        </ScreenCard>

        <AgentTimelinePanel runs={session.agentRuns} />
      </View>
    </ScrollView>
  );
}

function runTask(task: AiTask, session: ScreenSession) {
  switch (task) {
    case "short_summary":
      return aiService.summarize(session, "short");
    case "detailed_summary":
      return aiService.summarize(session, "detailed");
    case "key_points":
      return aiService.generateKeyPoints(session);
    case "explain":
      return aiService.explain(session);
    default:
      return aiService.summarize(session, "short");
  }
}
