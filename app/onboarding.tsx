import { useCallback, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";

import { OnboardingSlide, ONBOARDING_SLIDES } from "@/components/onboarding";
import { routes } from "@/constants/routes";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_SLIDES = ONBOARDING_SLIDES.length;
const LAST_SLIDE_INDEX = TOTAL_SLIDES - 1;

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function OnboardingRoute() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isLastSlide = activeIndex === LAST_SLIDE_INDEX;

  // ── Navigation ────────────────────────────────────────────────────────────

  const scrollToSlide = useCallback((index: number) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setActiveIndex(index);
  }, []);

  const handleNext = useCallback(() => {
    if (activeIndex < LAST_SLIDE_INDEX) {
      scrollToSlide(activeIndex + 1);
    }
  }, [activeIndex, scrollToSlide]);

  const handleSkip = useCallback(() => {
    // Skip to final CTA slide
    scrollToSlide(LAST_SLIDE_INDEX);
  }, [scrollToSlide]);

  const handleScrollEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      setActiveIndex(Math.min(Math.max(index, 0), LAST_SLIDE_INDEX));
    },
    []
  );

  // ── CTA handlers ──────────────────────────────────────────────────────────

  const handleLocalAiSetup = useCallback(() => {
    router.push(routes.localAiSetup);
  }, [router]);

  const handleStartFree = useCallback(() => {
    router.replace(routes.auth);
  }, [router]);

  const handleViewPlans = useCallback(() => {
    router.replace(routes.settings);
  }, [router]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View className="flex-1 bg-ink">
      {/* Skip button — visible on all slides except last */}
      {!isLastSlide && (
        <View className="absolute right-6 top-14 z-10">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            className="rounded-xl px-4 py-2 active:opacity-70"
            onPress={handleSkip}
          >
            <Text className="text-sm font-bold text-slate-500">Skip</Text>
          </Pressable>
        </View>
      )}

      {/* Slide pager */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        bounces={false}
        onMomentumScrollEnd={handleScrollEnd}
        style={{ flex: 1 }}
      >
        {ONBOARDING_SLIDES.map((slide) => (
          <OnboardingSlide key={slide.id} slide={slide} width={SCREEN_WIDTH} />
        ))}
      </ScrollView>

      {/* Bottom chrome — progress dots + CTAs */}
      <View className="absolute bottom-0 left-0 right-0 bg-ink/95 px-6 pb-12 pt-4">
        {/* Progress dots */}
        <View className="mb-5 flex-row items-center justify-center gap-2">
          {ONBOARDING_SLIDES.map((slide, index) => (
            <Pressable
              key={slide.id}
              accessibilityRole="button"
              accessibilityLabel={`Go to slide ${index + 1}`}
              onPress={() => scrollToSlide(index)}
            >
              <View
                className={`rounded-full transition-all ${
                  index === activeIndex
                    ? "h-2 w-6 bg-electric"
                    : "h-2 w-2 bg-white/20"
                }`}
              />
            </Pressable>
          ))}
        </View>

        {/* CTAs — final slide shows all three, other slides show Next */}
        {isLastSlide ? (
          <FinalCtas
            onLocalAi={handleLocalAiSetup}
            onStartFree={handleStartFree}
            onViewPlans={handleViewPlans}
          />
        ) : (
          <NextButton index={activeIndex} total={TOTAL_SLIDES} onPress={handleNext} />
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Bottom bar components
// ---------------------------------------------------------------------------

function NextButton({
  index,
  total,
  onPress
}: {
  index: number;
  total: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Next slide"
      className="min-h-14 items-center justify-center rounded-2xl bg-electric active:opacity-80"
      onPress={onPress}
    >
      <Text className="text-base font-black text-ink">
        Next  {index + 1}/{total}
      </Text>
    </Pressable>
  );
}

function FinalCtas({
  onLocalAi,
  onStartFree,
  onViewPlans
}: {
  onLocalAi: () => void;
  onStartFree: () => void;
  onViewPlans: () => void;
}) {
  return (
    <View className="gap-3">
      {/* Primary CTA — local AI setup */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Set up local AI with Ollama"
        className="min-h-14 items-center justify-center rounded-2xl bg-electric active:opacity-80"
        onPress={onLocalAi}
      >
        <Text className="text-base font-black text-ink">🏠  Set up Local AI</Text>
      </Pressable>

      {/* Secondary CTA — start free */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Start with free mode"
        className="min-h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 active:opacity-80"
        onPress={onStartFree}
      >
        <Text className="text-base font-black text-white">Start for free  →</Text>
      </Pressable>

      {/* Ghost CTA — plans */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="View plans"
        className="items-center py-3 active:opacity-70"
        onPress={onViewPlans}
      >
        <Text className="text-sm font-bold text-slate-500">View plans</Text>
      </Pressable>
    </View>
  );
}
