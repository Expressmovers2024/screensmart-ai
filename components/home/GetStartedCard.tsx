import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { routes } from "@/constants/routes";

// ---------------------------------------------------------------------------
// Checklist definition
// ---------------------------------------------------------------------------

type ChecklistItem = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  route?: string;
  actionLabel: string;
};

const ITEMS: ChecklistItem[] = [
  {
    id: "upload_screenshot",
    emoji: "📱",
    title: "Scan your first screen",
    description: "Upload any screenshot and let ScreenSmart read it for you.",
    route: routes.uploadScreenshot,
    actionLabel: "Upload →"
  },
  {
    id: "generate_summary",
    emoji: "📝",
    title: "Generate a summary",
    description: "Turn OCR text into a plain-language summary in one tap.",
    route: routes.summary,
    actionLabel: "Summarise →"
  },
  {
    id: "ask_talkback",
    emoji: "💬",
    title: "Ask TalkBack a question",
    description: "Chat with the AI about anything visible on the screen.",
    route: routes.talkbackChat,
    actionLabel: "Ask →"
  },
  {
    id: "setup_local_ai",
    emoji: "🏠",
    title: "Set up Local AI",
    description: "Run AI privately on your own machine — free forever.",
    route: routes.localAiSetup,
    actionLabel: "Set up →"
  },
  {
    id: "check_usage",
    emoji: "📊",
    title: "Check usage transparency",
    description: "See exactly where every AI request went — local, free cloud, or mock.",
    route: routes.settings,
    actionLabel: "View →"
  }
];

const STORAGE_KEY = "screensmart:v2:checklist_completed";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GetStartedCard() {
  const router = useRouter();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(false);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setCompleted(new Set(JSON.parse(raw) as string[]));
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markDone = useCallback(
    async (id: string) => {
      const next = new Set(completed);
      next.add(id);
      setCompleted(next);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // Non-fatal
      }
    },
    [completed]
  );

  const handleAction = useCallback(
    async (item: ChecklistItem) => {
      await markDone(item.id);
      if (item.route) router.push(item.route as Parameters<typeof router.push>[0]);
    },
    [markDone, router]
  );

  const allDone = ITEMS.every((i) => completed.has(i.id));
  const doneCount = ITEMS.filter((i) => completed.has(i.id)).length;

  if (allDone) return null;

  return (
    <View className="rounded-[32px] border border-electric/20 bg-electric/5 p-6">
      {/* Header */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={collapsed ? "Expand checklist" : "Collapse checklist"}
        className="mb-4 flex-row items-center justify-between active:opacity-70"
        onPress={() => setCollapsed((c) => !c)}
      >
        <View>
          <Text className="text-xs font-black uppercase tracking-[2px] text-electric">
            Get started
          </Text>
          <Text className="mt-1 text-xl font-black text-white">
            {doneCount}/{ITEMS.length} complete
          </Text>
        </View>
        <View className="rounded-full bg-electric/10 px-3 py-1.5">
          <Text className="text-xs font-black text-electric">
            {collapsed ? "Show" : "Hide"}
          </Text>
        </View>
      </Pressable>

      {/* Progress bar */}
      <View className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <View
          className="h-1.5 rounded-full bg-electric"
          style={{ width: `${(doneCount / ITEMS.length) * 100}%` }}
        />
      </View>

      {!collapsed && (
        <View className="gap-2">
          {ITEMS.map((item) => {
            const done = completed.has(item.id);
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}: ${done ? "done" : "not done"}`}
                className={`flex-row items-center gap-3 rounded-2xl border px-4 py-3 active:opacity-70 ${
                  done
                    ? "border-white/5 bg-white/5"
                    : "border-electric/10 bg-white/5"
                }`}
                onPress={() => void handleAction(item)}
              >
                {/* Completion dot */}
                <View
                  className={`h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                    done ? "bg-mint" : "border border-white/20 bg-transparent"
                  }`}
                >
                  {done && <Text className="text-xs font-black text-ink">✓</Text>}
                </View>

                <View className="flex-1">
                  <Text
                    className={`text-sm font-bold ${done ? "text-slate-500 line-through" : "text-white"}`}
                  >
                    {item.emoji}  {item.title}
                  </Text>
                  {!done && (
                    <Text className="mt-0.5 text-xs text-slate-500">{item.description}</Text>
                  )}
                </View>

                {!done && (
                  <Text className="text-xs font-black text-electric">{item.actionLabel}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
