import { FoundationScreen } from "@/components/ui";
import { routes } from "@/constants/routes";

export default function OnboardingRoute() {
  return (
    <FoundationScreen
      title="Onboarding"
      description="First-run education for the ScreenSmart AI mobile screen companion."
      nextHref={routes.auth}
      nextLabel="Continue to auth"
    />
  );
}
