import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { LoadingState, PrimaryButton, ReadableTextBlock, ScreenCard } from "@/components/ui";
import { useCurrentSession } from "@/hooks/useCurrentSession";
import { aiService, type AiResponse, type AiTask } from "@/services/ai";
import { useSessionStore } from "@/store/sessionStore";
import type { ScreenSession } from "@/types/screenSession";

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

const fallbackSession: ScreenSession = {
  id: "summary-fallback-session",
  createdAt: new Date().toISOString(),
  ocr: {
    id: "summary-fallback-ocr",
    blocks: [],
    confidence: 0.5,
    extractedText: "Upload and scan a screenshot to generate AI summaries grounded in OCR text.",
    processedAt: new Date().toISOString(),
    provider: "placeholder",
    rawText: "Upload and scan a screenshot to generate AI summaries grounded in OCR text.",
    sourceImage: {
      uri: "placeholder://summary"
    }
  }
};

export default function SummaryRoute() {
  const currentSession = useCurrentSession();
  const updateCurrentSession = useSessionStore((state) => state.updateCurrentSession);
  const session = currentSession ?? fallbackSession;
  const [response, setResponse] = useState<AiResponse | null>(null);
  const [activeTask, setActiveTask] = useState<AiTask | null>(null);
  const [lastTask, setLastTask] = useState<AiTask>("short_summary");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const generate = async (task: AiTask) => {
    setActiveTask(task);
    setLastTask(task);
    setErrorMessage(null);

    try {
      const nextResponse = await runTask(task, session);

      setResponse(nextResponse);
      if (task === "short_summary" || task === "detailed_summary") {
        updateCurrentSession({ summary: nextResponse.content });
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "AI generation failed.");
    } finally {
      setActiveTask(null);
    }
  };

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
            progress={0.66}
          />
        ) : null}

        {errorMessage ? (
          <ScreenCard eyebrow="AI error" title="Generation failed">
            <Text className="text-base leading-7 text-red-100">{errorMessage}</Text>
            <PrimaryButton label="Retry generation" onPress={() => generate(lastTask)} />
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
        </ScreenCard>
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
