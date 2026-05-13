import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View
} from "react-native";

import { PrimaryButton, ScreenCard } from "@/components/ui";
import { providerRegistry, providerRouter } from "@/src/providers";
import { useLocalAiSettings } from "@/hooks/useLocalAiSettings";
import { createId } from "@/utils/createId";

// ---------------------------------------------------------------------------
// Recommended models
// ---------------------------------------------------------------------------

type RecommendedModel = {
  id: string;
  name: string;
  pullName: string;
  size: string;
  bestFor: string;
  description: string;
  emoji: string;
};

const RECOMMENDED_MODELS: RecommendedModel[] = [
  {
    id: "llama3.1:8b",
    name: "Llama 3.1 · 8B",
    pullName: "llama3.1:8b",
    size: "~5 GB",
    bestFor: "General reasoning",
    description:
      "Meta's best open model for everyday tasks. Great at summarising screens, answering questions, and explaining content.",
    emoji: "🦙"
  },
  {
    id: "mistral:7b",
    name: "Mistral · 7B",
    pullName: "mistral:7b",
    size: "~4 GB",
    bestFor: "Fast summaries",
    description:
      "Very fast and efficient. Perfect for quick one-sentence summaries when you want an instant answer.",
    emoji: "⚡"
  },
  {
    id: "qwen2.5-coder:7b",
    name: "Qwen 2.5 Coder · 7B",
    pullName: "qwen2.5-coder:7b",
    size: "~5 GB",
    bestFor: "Code & technical screens",
    description:
      "Excellent at reading and explaining code, error messages, and developer dashboards.",
    emoji: "💻"
  }
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OllamaStatus = "idle" | "checking" | "connected" | "disconnected";

type InstalledModel = {
  name: string;
  size: number;
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function LocalAiSetupScreen() {
  const router = useRouter();
  const { prefs, isSaving, save } = useLocalAiSettings();

  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>("idle");
  const [installedModels, setInstalledModels] = useState<InstalledModel[]>([]);
  const [isTestingGeneration, setIsTestingGeneration] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const checkOllama = useCallback(async () => {
    setOllamaStatus("checking");
    setInstalledModels([]);
    try {
      const ollama = providerRegistry.get("ollama");
      if (!ollama) {
        setOllamaStatus("disconnected");
        return;
      }
      const status = await ollama.healthCheck();
      setOllamaStatus(status.available ? "connected" : "disconnected");
      if (status.available) {
        // Fetch model list
        const models = await (
          ollama as unknown as { listModels: () => Promise<string[]> }
        ).listModels();
        setInstalledModels(models.map((name) => ({ name, size: 0 })));
      }
    } catch {
      setOllamaStatus("disconnected");
    }
  }, []);

  // Auto-check on mount
  useEffect(() => {
    void checkOllama();
  }, [checkOllama]);

  const testGeneration = async () => {
    setIsTestingGeneration(true);
    setTestResult(null);
    setTestError(null);
    try {
      const response = await providerRouter.route({
        requiredCapabilities: ["text_generation", "local"],
        preferredCostTier: "free",
        prompt:
          "In one sentence, confirm you are a local AI running on this device. Be friendly.",
        context: {
          sessionId: createId("test"),
          extractedText: "Test generation from ScreenSmart local AI setup.",
          category: "general"
        }
      });
      setTestResult(response.content);
    } catch (err) {
      setTestError(
        err instanceof Error ? err.message : "Test failed. Is Ollama running?"
      );
    } finally {
      setIsTestingGeneration(false);
    }
  };

  const selectModel = async (modelId: string) => {
    await save({ preferredLocalModel: modelId });
    Alert.alert(
      "Model saved",
      `ScreenSmart will use ${modelId} for local AI generation.`
    );
  };

  const isConnected = ollamaStatus === "connected";
  const isChecking = ollamaStatus === "checking";

  return (
    <ScrollView
      className="flex-1 bg-ink"
      contentContainerClassName="px-6 pb-16 pt-14"
    >
      {/* Back button */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        className="mb-6 self-start active:opacity-70"
        onPress={() => router.back()}
      >
        <Text className="text-sm font-bold text-electric">← Back to Settings</Text>
      </Pressable>

      {/* Hero */}
      <View className="mb-8">
        <Text className="text-xs font-black uppercase tracking-[2px] text-electric">
          Local AI
        </Text>
        <Text className="mt-2 text-4xl font-black leading-tight text-white">
          AI that stays on your device
        </Text>
        <Text className="mt-4 text-base leading-7 text-slate-300">
          Run AI models locally using Ollama — no internet required,
          no usage credits, nothing leaves your device.
        </Text>
      </View>

      <View className="gap-5">
        {/* Why Local AI */}
        <ScreenCard eyebrow="Benefits" title="Why run AI locally?">
          <BenefitRow
            emoji="🔒"
            title="Your data never leaves your device"
            body="Everything stays on your machine. No cloud logging, no data collection."
          />
          <BenefitRow
            emoji="💸"
            title="Free forever"
            body="No API credits, no monthly bills. Once the model is downloaded, it's free to run as much as you like."
          />
          <BenefitRow
            emoji="📶"
            title="Works without internet"
            body="Summarise and explain screens even in airplane mode or poor signal."
          />
          <BenefitRow
            emoji="⚡"
            title="Fast on modern hardware"
            body="On a Mac with Apple Silicon or a PC with a capable GPU, responses arrive in seconds."
          />
        </ScreenCard>

        {/* Limitations */}
        <ScreenCard eyebrow="Good to know" title="Limitations">
          <Text className="text-sm leading-6 text-slate-400">
            Local models are smaller than cloud models like GPT-4 or Claude, so
            they may sometimes give less detailed answers. They also need
            around 8 GB of free RAM. ScreenSmart will automatically fall back
            to OpenRouter (free cloud) if local AI is unavailable.
          </Text>
        </ScreenCard>

        {/* Requirements */}
        <ScreenCard eyebrow="Requirements" title="What you need">
          <RequirementRow label="Ollama installed" note="Free download at ollama.ai" />
          <RequirementRow label="8 GB RAM" note="16 GB recommended for best performance" />
          <RequirementRow label="5–10 GB disk space" note="Per model downloaded" />
          <RequirementRow label="Mac, Windows, or Linux" note="Any modern computer works" />
        </ScreenCard>

        {/* Install Ollama */}
        <ScreenCard eyebrow="Step 1" title="Install Ollama">
          <Text className="text-sm leading-6 text-slate-300">
            Download and install Ollama from{" "}
            <Text className="font-bold text-electric">ollama.ai</Text>
            {" "}— it takes about 2 minutes. Once installed, Ollama runs in the
            background automatically.
          </Text>
          <InstallCommand
            platform="Mac"
            command="brew install ollama"
            note="(or download the Mac app from ollama.ai)"
          />
          <InstallCommand
            platform="Windows"
            command="Download OllamaSetup.exe from ollama.ai"
            note="Then run it — no terminal needed"
          />
          <InstallCommand
            platform="Linux"
            command="curl -fsSL https://ollama.ai/install.sh | sh"
            note="Installs in one command"
          />
        </ScreenCard>

        {/* Connection status */}
        <ScreenCard eyebrow="Step 2" title="Check connection">
          <OllamaStatusBadge status={ollamaStatus} />

          {isConnected && installedModels.length > 0 && (
            <View className="mt-2">
              <Text className="mb-2 text-xs font-black uppercase tracking-[1.5px] text-mint">
                Installed models ({installedModels.length})
              </Text>
              <View className="gap-1.5">
                {installedModels.map((m) => (
                  <View
                    key={m.name}
                    className="flex-row items-center justify-between rounded-xl bg-white/5 px-4 py-2"
                  >
                    <Text className="text-sm font-bold text-white">{m.name}</Text>
                    {prefs.preferredLocalModel === m.name && (
                      <View className="rounded-full bg-electric/10 px-2 py-0.5">
                        <Text className="text-xs font-black text-electric">Active</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {isConnected && installedModels.length === 0 && (
            <Text className="text-sm text-slate-400">
              Ollama is running but no models are installed yet. Pull one below.
            </Text>
          )}

          {!isConnected && ollamaStatus !== "idle" && (
            <Text className="text-sm leading-6 text-slate-400">
              Ollama does not appear to be running at{" "}
              <Text className="font-mono text-slate-300">localhost:11434</Text>.
              Make sure Ollama is installed and open on your computer.
            </Text>
          )}

          <PrimaryButton
            label={isChecking ? "Checking..." : "Check Ollama status"}
            disabled={isChecking}
            onPress={checkOllama}
            variant="secondary"
          />
        </ScreenCard>

        {/* Recommended models */}
        <ScreenCard eyebrow="Step 3" title="Download a model">
          <Text className="text-sm leading-6 text-slate-400">
            Open your terminal and run one of these commands to download a model.
            You only need to do this once.
          </Text>
          <View className="gap-4">
            {RECOMMENDED_MODELS.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                isInstalled={installedModels.some(
                  (m) => m.name === model.id || m.name.startsWith(model.pullName.split(":")[0])
                )}
                isSelected={prefs.preferredLocalModel === model.id}
                onSelect={() => void selectModel(model.id)}
              />
            ))}
          </View>
        </ScreenCard>

        {/* Test generation */}
        {isConnected && installedModels.length > 0 && (
          <ScreenCard eyebrow="Step 4" title="Test it out">
            <Text className="text-sm leading-6 text-slate-400">
              Run a quick test to confirm local AI is working. This sends a
              short message to your locally running model.
            </Text>

            {testResult && (
              <View className="rounded-2xl border border-mint/20 bg-mint/5 p-4">
                <Text className="mb-1 text-xs font-black uppercase tracking-[1.5px] text-mint">
                  Local AI response
                </Text>
                <Text className="text-sm leading-6 text-slate-200">{testResult}</Text>
              </View>
            )}

            {testError && (
              <View className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                <Text className="text-sm font-bold text-red-400">Test failed</Text>
                <Text className="mt-1 text-xs text-slate-400">{testError}</Text>
              </View>
            )}

            <PrimaryButton
              label={isTestingGeneration ? "Testing..." : "Run test generation"}
              disabled={isTestingGeneration}
              onPress={() => void testGeneration()}
              icon={isTestingGeneration ? <ActivityIndicator size="small" color="#030712" /> : undefined}
            />
          </ScreenCard>
        )}

        {/* Preferences */}
        <ScreenCard eyebrow="Settings" title="Local AI preferences">
          <PreferenceToggle
            title="Prefer local AI"
            body="When on, ScreenSmart always tries Ollama first before using cloud AI."
            value={prefs.preferLocalModels}
            disabled={isSaving}
            onToggle={(v) => void save({ preferLocalModels: v })}
          />
          <PreferenceToggle
            title="Allow cloud fallback"
            body="When local AI is unavailable, automatically fall back to OpenRouter (free cloud AI)."
            value={prefs.allowCloudFallback}
            disabled={isSaving}
            onToggle={(v) => void save({ allowCloudFallback: v })}
          />

          {prefs.preferredLocalModel && (
            <View className="rounded-2xl bg-white/5 p-3">
              <Text className="text-xs font-black uppercase tracking-[1.5px] text-slate-400">
                Preferred model
              </Text>
              <Text className="mt-1 text-sm font-bold text-white">
                {prefs.preferredLocalModel}
              </Text>
              <Pressable
                className="mt-2 active:opacity-70"
                onPress={() => void save({ preferredLocalModel: undefined })}
              >
                <Text className="text-xs font-bold text-red-400">Clear preference</Text>
              </Pressable>
            </View>
          )}

          <View className="rounded-2xl bg-white/5 p-3">
            <Text className="text-xs font-black uppercase tracking-[1.5px] text-slate-400">
              Active routing
            </Text>
            <Text className="mt-1 text-xs font-bold text-slate-300">
              {providerRouter.describeFallbackChain()}
            </Text>
          </View>
        </ScreenCard>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function BenefitRow({
  emoji,
  title,
  body
}: {
  emoji: string;
  title: string;
  body: string;
}) {
  return (
    <View className="flex-row gap-3">
      <Text className="text-xl">{emoji}</Text>
      <View className="flex-1">
        <Text className="text-sm font-bold text-white">{title}</Text>
        <Text className="mt-0.5 text-xs leading-5 text-slate-400">{body}</Text>
      </View>
    </View>
  );
}

function RequirementRow({ label, note }: { label: string; note: string }) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="mt-1 h-2 w-2 rounded-full bg-electric" />
      <View className="flex-1">
        <Text className="text-sm font-bold text-white">{label}</Text>
        <Text className="text-xs text-slate-500">{note}</Text>
      </View>
    </View>
  );
}

function InstallCommand({
  platform,
  command,
  note
}: {
  platform: string;
  command: string;
  note: string;
}) {
  return (
    <View className="rounded-2xl bg-white/5 p-4">
      <Text className="mb-1 text-xs font-black uppercase tracking-[1.5px] text-slate-500">
        {platform}
      </Text>
      <Text className="font-mono text-sm text-mint" selectable>
        {command}
      </Text>
      <Text className="mt-1 text-xs text-slate-500">{note}</Text>
    </View>
  );
}

function OllamaStatusBadge({ status }: { status: OllamaStatus }) {
  const config = {
    idle: { color: "bg-slate-600", text: "text-slate-400", label: "Not checked yet" },
    checking: { color: "bg-yellow-500", text: "text-yellow-300", label: "Checking..." },
    connected: { color: "bg-mint", text: "text-mint", label: "Ollama is running ✓" },
    disconnected: { color: "bg-red-500", text: "text-red-400", label: "Ollama not found" }
  }[status];

  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      {status === "checking" ? (
        <ActivityIndicator size="small" color="#FBBF24" />
      ) : (
        <View className={`h-3 w-3 rounded-full ${config.color}`} />
      )}
      <Text className={`text-sm font-bold ${config.text}`}>{config.label}</Text>
    </View>
  );
}

function ModelCard({
  model,
  isInstalled,
  isSelected,
  onSelect
}: {
  model: RecommendedModel;
  isInstalled: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <View
      className={`rounded-2xl border p-4 ${
        isSelected ? "border-electric/40 bg-electric/5" : "border-white/10 bg-white/5"
      }`}
    >
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="text-xl">{model.emoji}</Text>
          <View>
            <Text className="text-sm font-black text-white">{model.name}</Text>
            <Text className="text-xs text-slate-500">
              {model.size} · Best for: {model.bestFor}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-2">
          {isInstalled && (
            <View className="rounded-full bg-mint/10 px-2 py-0.5">
              <Text className="text-xs font-black text-mint">Installed</Text>
            </View>
          )}
          {isSelected && (
            <View className="rounded-full bg-electric/10 px-2 py-0.5">
              <Text className="text-xs font-black text-electric">Active</Text>
            </View>
          )}
        </View>
      </View>

      <Text className="mb-3 text-xs leading-5 text-slate-400">{model.description}</Text>

      {/* Pull command */}
      <View className="mb-3 rounded-xl bg-black/30 p-3">
        <Text className="mb-1 text-xs font-black uppercase tracking-[1px] text-slate-500">
          Terminal command
        </Text>
        <Text className="font-mono text-sm text-mint" selectable>
          ollama pull {model.pullName}
        </Text>
      </View>

      {isInstalled && !isSelected && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Use ${model.name} as preferred model`}
          className="rounded-xl bg-electric/10 px-4 py-2.5 active:opacity-70"
          onPress={onSelect}
        >
          <Text className="text-center text-xs font-black text-electric">
            Use this model
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function PreferenceToggle({
  title,
  body,
  value,
  disabled,
  onToggle
}: {
  title: string;
  body: string;
  value: boolean;
  disabled: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      <View className="flex-1">
        <Text className="text-sm font-bold text-white">{title}</Text>
        <Text className="mt-0.5 text-xs leading-5 text-slate-400">{body}</Text>
      </View>
      <Switch disabled={disabled} value={value} onValueChange={onToggle} />
    </View>
  );
}
