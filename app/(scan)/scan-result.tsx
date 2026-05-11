import { useState } from "react";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { Image, ScrollView, Text, View } from "react-native";

import { AgentTimelinePanel, ScreenIntelligenceCards, WorkflowCheckpointCard } from "@/components/agents";
import { PrimaryButton, ReadableTextBlock, RetryState, ScreenCard } from "@/components/ui";
import { routes } from "@/constants/routes";
import { storageService, type Mission } from "@/services/storage";
import { MissionPlannerAgent, OrchestratorAgent, type ContinueTaskPlan } from "@/src/agents";
import { useSessionStore } from "@/store/sessionStore";

const orchestratorAgent = new OrchestratorAgent();
const missionPlannerAgent = new MissionPlannerAgent();

export default function ScanResultRoute() {
  const router = useRouter();
  const currentSession = useSessionStore((state) => state.currentSession);
  const updateCurrentSession = useSessionStore((state) => state.updateCurrentSession);
  const saveCurrentSessionToLibrary = useSessionStore((state) => state.saveCurrentSessionToLibrary);
  const [copyStatus, setCopyStatus] = useState("Copy extracted text");
  const [saveStatus, setSaveStatus] = useState("Save to library");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [continuePlan, setContinuePlan] = useState<ContinueTaskPlan | null>(null);
  const [mission, setMission] = useState<Mission | null>(null);

  const extractedText = currentSession?.ocr?.extractedText;

  const copyText = async () => {
    if (!extractedText) {
      return;
    }

    try {
      setErrorMessage(null);
      await Clipboard.setStringAsync(extractedText);
      setCopyStatus("Copied");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to copy extracted text.");
    }
  };

  const saveToLibrary = async () => {
    const savedSession = saveCurrentSessionToLibrary();

    if (savedSession) {
      setIsSaving(true);
      setErrorMessage(null);
      try {
        await storageService.saveScreenSession(savedSession);
        setSaveStatus("Saved to library");
      } catch (error) {
        setSaveStatus("Retry save");
        setErrorMessage(error instanceof Error ? error.message : "Unable to save this OCR session.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSuggestedAction = (action: string) => {
    const normalized = action.toLowerCase();

    if (normalized.includes("follow-up") || normalized.includes("talkback") || normalized.includes("risk")) {
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

    router.push(routes.summary);
  };

  const continueTask = async () => {
    if (!currentSession) {
      return;
    }

    const plan = await orchestratorAgent.continueTask(currentSession);
    const workflowCheckpoints = [plan.checkpoint, ...(currentSession.workflowCheckpoints ?? [])];
    const existingMission = (await storageService.listMissions()).find((item) => item.sessionIds.includes(currentSession.id));
    const missionResult = await missionPlannerAgent.execute(
      {
        checkpoint: plan.checkpoint,
        existingMission,
        session: {
          ...currentSession,
          workflowCheckpoints
        }
      },
      {
        sessionId: currentSession.id
      }
    );
    const nextSession = {
      ...currentSession,
      lastActiveAt: new Date().toISOString(),
      workflowCheckpoints
    };

    setContinuePlan(plan);
    setMission(missionResult.output.mission);
    updateCurrentSession({ lastActiveAt: nextSession.lastActiveAt, workflowCheckpoints });
    void storageService.saveScreenSession(nextSession);
  };

  if (!currentSession || !currentSession.ocr) {
    return (
      <ScrollView className="flex-1 bg-ink" contentContainerClassName="px-6 pb-12 pt-14">
        <View className="mb-8">
          <Text className="text-xs font-black uppercase tracking-[2px] text-electric">OCR result</Text>
          <Text className="mt-3 text-4xl font-black leading-tight text-white">No OCR result yet</Text>
          <Text className="mt-4 text-base leading-7 text-slate-300">
            Upload a screenshot first to generate placeholder extracted text.
          </Text>
        </View>
        <ScreenCard title="Start OCR processing">
          <PrimaryButton label="Upload screenshot" onPress={() => router.push(routes.uploadScreenshot)} />
        </ScreenCard>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-ink" contentContainerClassName="px-6 pb-12 pt-14">
      <View className="mb-8">
        <Text className="text-xs font-black uppercase tracking-[2px] text-electric">OCR result</Text>
        <Text className="mt-3 text-4xl font-black leading-tight text-white">Extracted screen text</Text>
        <Text className="mt-4 text-base leading-7 text-slate-300">
          Review the placeholder OCR output, copy it, or save the session to your local library state.
        </Text>
      </View>

      <View className="gap-5">
        {currentSession.screenshot ? (
          <ScreenCard eyebrow="Screenshot" title="Uploaded image">
            <Image
              accessibilityLabel="Uploaded screenshot preview"
              className="h-72 w-full rounded-[28px] bg-panel"
              source={{ uri: currentSession.screenshot.uri }}
            />
          </ScreenCard>
        ) : null}

        <ScreenCard eyebrow="Readable OCR" title="Extracted text">
          <ReadableTextBlock text={currentSession.ocr.extractedText} />
          <Text className="text-xs font-black uppercase tracking-[1.5px] text-slate-400">
            Confidence {Math.round(currentSession.ocr.confidence * 100)}% • Processed{" "}
            {new Date(currentSession.ocr.processedAt).toLocaleTimeString()}
          </Text>
          <PrimaryButton label={copyStatus} onPress={copyText} />
          <PrimaryButton disabled={isSaving} label={isSaving ? "Saving..." : saveStatus} onPress={saveToLibrary} variant="secondary" />
          {errorMessage ? <RetryState title="Action failed" message={errorMessage} onRetry={saveToLibrary} /> : null}
        </ScreenCard>

        <ScreenIntelligenceCards
          intelligence={currentSession.screenIntelligence}
          onActionPress={handleSuggestedAction}
          onContinue={continueTask}
        />

        <WorkflowCheckpointCard
          checkpoints={currentSession.workflowCheckpoints}
          mission={mission}
          plan={continuePlan}
          onActionPress={handleSuggestedAction}
          onContinue={continueTask}
        />

        <AgentTimelinePanel runs={currentSession.agentRuns} />

        <ScreenCard title="Next steps">
          <Text className="text-base leading-7 text-slate-300">
            Generate the first AI summary, listen to it aloud, or ask a TalkBack follow-up grounded in this OCR text.
          </Text>
          <PrimaryButton label="Generate AI summary" onPress={() => router.push(routes.summary)} />
          <PrimaryButton label="Listen with TTS" onPress={() => router.push(routes.audioReader)} variant="secondary" />
          <PrimaryButton label="Ask TalkBack follow-up" onPress={() => router.push(routes.talkbackChat)} variant="ghost" />
        </ScreenCard>
      </View>
    </ScrollView>
  );
}
