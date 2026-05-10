import { AppButton, AppScreen, Card, ScreenSection } from "../src/components/ui";
import { routes } from "../src/navigation/routes";

export default function OnboardingRoute() {
  return (
    <AppScreen
      title="Understand screenshots with AI."
      subtitle="A welcoming first-run flow for explaining what ScreenSmart can do before users land in the app."
    >
      <Card eyebrow="Onboarding" title="Built for clarity">
        <ScreenSection
          items={[
            "Read important text from screenshots.",
            "Summarize confusing screens in plain language.",
            "Prepare voice and TalkBack-friendly explanations."
          ]}
        />
      </Card>
      <Card title="Accessibility first">
        <ScreenSection
          items={[
            "Large touch targets for primary actions.",
            "Simple route structure for future onboarding steps.",
            "Mobile-first layout with comfortable spacing."
          ]}
        />
        <AppButton label="Continue to home" href={routes.home} />
      </Card>
    </AppScreen>
  );
}
