import { Dimensions, ScrollView, Text, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ---------------------------------------------------------------------------
// Slide data types
// ---------------------------------------------------------------------------

export type OnboardingSlideBullet = {
  emoji: string;
  title: string;
  body: string;
};

export type OnboardingAgent = {
  emoji: string;
  name: string;
  role: string;
};

export type OnboardingSlideData = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  /** Large centred visual — emoji string or sequence */
  visual: string;
  /** Tailwind bg class for the visual container */
  visualBg: string;
  /** Tailwind text class for the visual emoji (controls size) */
  visualSize?: string;
  bullets?: OnboardingSlideBullet[];
  agents?: OnboardingAgent[];
  /** Optional footer note in smaller dimmed text */
  footnote?: string;
};

// ---------------------------------------------------------------------------
// Slide component
// ---------------------------------------------------------------------------

type OnboardingSlideProps = {
  slide: OnboardingSlideData;
  /** Matches SCREEN_WIDTH so each slide fills the viewport exactly */
  width: number;
};

export function OnboardingSlide({ slide, width }: OnboardingSlideProps) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{ width }}
      contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 160, paddingTop: 56 }}
    >
      {/* Visual */}
      <View
        className={`mb-8 h-24 w-24 items-center justify-center self-center rounded-[28px] ${slide.visualBg}`}
      >
        <Text className={slide.visualSize ?? "text-5xl"}>{slide.visual}</Text>
      </View>

      {/* Eyebrow */}
      <Text className="mb-2 text-center text-xs font-black uppercase tracking-[2.5px] text-electric">
        {slide.eyebrow}
      </Text>

      {/* Title */}
      <Text className="mb-4 text-center text-3xl font-black leading-tight text-white">
        {slide.title}
      </Text>

      {/* Body */}
      <Text className="mb-8 text-center text-base leading-7 text-slate-300">
        {slide.body}
      </Text>

      {/* Bullets */}
      {slide.bullets && slide.bullets.length > 0 && (
        <View className="mb-4 gap-3">
          {slide.bullets.map((b, i) => (
            <BulletRow key={i} bullet={b} />
          ))}
        </View>
      )}

      {/* Agents */}
      {slide.agents && slide.agents.length > 0 && (
        <View className="gap-2">
          {slide.agents.map((agent, i) => (
            <AgentRow key={i} agent={agent} index={i} />
          ))}
        </View>
      )}

      {/* Footnote */}
      {slide.footnote && (
        <Text className="mt-6 text-center text-xs leading-5 text-slate-600">
          {slide.footnote}
        </Text>
      )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function BulletRow({ bullet }: { bullet: OnboardingSlideBullet }) {
  return (
    <View className="flex-row items-start gap-4 rounded-2xl border border-white/5 bg-white/5 p-4">
      <View className="h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/10">
        <Text className="text-xl">{bullet.emoji}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-black text-white">{bullet.title}</Text>
        <Text className="mt-0.5 text-xs leading-5 text-slate-400">{bullet.body}</Text>
      </View>
    </View>
  );
}

function AgentRow({ agent, index }: { agent: OnboardingAgent; index: number }) {
  const accentColors = [
    "bg-electric/10 text-electric border-electric/20",
    "bg-mint/10 text-mint border-mint/20",
    "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    "bg-pink-500/10 text-pink-400 border-pink-500/20",
    "bg-orange-500/10 text-orange-400 border-orange-500/20"
  ];
  const accent = accentColors[index % accentColors.length];
  const [bg, textColor, border] = accent.split(" ");

  return (
    <View className={`flex-row items-center gap-3 rounded-xl border ${border} ${bg} px-4 py-3`}>
      <Text className="text-xl">{agent.emoji}</Text>
      <View className="flex-1">
        <Text className={`text-sm font-black ${textColor}`}>{agent.name}</Text>
        <Text className="text-xs text-slate-400">{agent.role}</Text>
      </View>
      <View className={`rounded-full px-2 py-0.5 ${bg}`}>
        <Text className={`text-xs font-black ${textColor}`}>Agent</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Slide data — the five onboarding screens
// ---------------------------------------------------------------------------

export const ONBOARDING_SLIDES: OnboardingSlideData[] = [
  {
    id: "what_is_screensmart",
    eyebrow: "Welcome to ScreenSmart",
    title: "AI that reads your screen",
    body: "Take a screenshot of anything — a bill, an error, an email, a tutorial. ScreenSmart reads it, understands it, and tells you what it means and what to do next.",
    visual: "📱",
    visualBg: "bg-electric/10",
    bullets: [
      {
        emoji: "🔍",
        title: "Instant summaries",
        body: "Turn any screenshot into a plain-language summary in seconds."
      },
      {
        emoji: "📝",
        title: "Auto-generated notes",
        body: "Key points and action items saved automatically to your library."
      },
      {
        emoji: "🔬",
        title: "Research intelligence",
        body: "Screen content becomes structured research plans with sources to check."
      },
      {
        emoji: "🎯",
        title: "Mission workflows",
        body: "Save your work as missions with checkpoints and next steps."
      }
    ]
  },
  {
    id: "free_local_ai",
    eyebrow: "Free & Private",
    title: "Runs on your computer, not the cloud",
    body: "Connect Ollama to run AI models locally. Your screenshots stay on your device. No credit packs, no usage anxiety, no surprise bills — ever.",
    visual: "🏠",
    visualBg: "bg-mint/10",
    bullets: [
      {
        emoji: "🔒",
        title: "Total privacy",
        body: "Your screenshots never leave your device. No cloud logging, no data collection."
      },
      {
        emoji: "💸",
        title: "Free forever",
        body: "Once the model is downloaded, there's no cost to run it as much as you like."
      },
      {
        emoji: "📶",
        title: "Works offline",
        body: "Summarise and explain screens even without an internet connection."
      },
      {
        emoji: "⚡",
        title: "Fast on modern hardware",
        body: "Mac Apple Silicon and modern PCs deliver responses in seconds."
      }
    ],
    footnote: "Requires Ollama installed on your computer. Free download at ollama.ai"
  },
  {
    id: "hosted_cloud",
    eyebrow: "Pro Cloud",
    title: "We handle the infrastructure when you need it",
    body: "No local setup required. Pay one simple monthly price and get hosted premium AI, cloud sync across all your devices, and advanced memory that learns your context.",
    visual: "⚡",
    visualBg: "bg-electric/10",
    bullets: [
      {
        emoji: "📋",
        title: "One monthly price",
        body: "No confusing credit packs. One subscription covers everything — unlimited AI use within your plan."
      },
      {
        emoji: "🚀",
        title: "Premium AI models",
        body: "Priority access to the fastest, most capable hosted models — no queue, no wait."
      },
      {
        emoji: "🔄",
        title: "Cloud sync",
        body: "Sessions, notes, and missions available on every device, always up to date."
      },
      {
        emoji: "🧠",
        title: "Advanced memory",
        body: "ScreenSmart remembers your context across sessions so you never re-explain the same thing twice."
      }
    ],
    footnote: "\"Free when you run it locally. Paid when we run the infrastructure for you.\""
  },
  {
    id: "usage_transparency",
    eyebrow: "Total Transparency",
    title: "You see every AI request we make",
    body: "Every AI call in ScreenSmart shows you exactly where it went — your local model, free cloud, or offline fallback. We don't hide routing decisions or charge for requests you didn't expect.",
    visual: "📊",
    visualBg: "bg-white/5",
    bullets: [
      {
        emoji: "🏠",
        title: "Local Ollama",
        body: "Shown when your own computer handled the request. Cost: $0. Completely private."
      },
      {
        emoji: "☁️",
        title: "OpenRouter Free",
        body: "Shown when a free-tier cloud model was used. Cost: $0. No billing surprises."
      },
      {
        emoji: "🤖",
        title: "Mock fallback",
        body: "Shown when no AI was available. Placeholder response, clearly labelled."
      },
      {
        emoji: "💳",
        title: "Paid cloud",
        body: "Only used on Pro plans, always visible in your usage history with estimated cost."
      }
    ]
  },
  {
    id: "agent_os_vision",
    eyebrow: "Agent OS",
    title: "Six AI agents working as a team",
    body: "ScreenSmart isn't a single AI — it's a coordinated swarm of specialist agents. Each one handles one part of understanding your screen, then hands off to the next.",
    visual: "🤖",
    visualBg: "bg-purple-500/10",
    agents: [
      {
        emoji: "🔍",
        name: "OCR Agent",
        role: "Extracts every word from your screenshot with confidence scoring"
      },
      {
        emoji: "👁️",
        name: "Vision Agent",
        role: "Classifies the screen type, app, and user intent from image + text"
      },
      {
        emoji: "📝",
        name: "Summary Agent",
        role: "Generates short and detailed summaries grounded in OCR context"
      },
      {
        emoji: "💬",
        name: "TalkBack Agent",
        role: "Answers your follow-up questions about anything on the screen"
      },
      {
        emoji: "🔬",
        name: "Research Agent",
        role: "Builds structured research plans with citations and search queries"
      },
      {
        emoji: "🎯",
        name: "Mission Planner",
        role: "Saves workflows as missions with checkpoints and next steps"
      }
    ],
    footnote: "All agents route through the Provider Abstraction Layer — local or cloud, your choice."
  }
];
