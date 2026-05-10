import { FoundationScreen } from "@/components/ui";
import { routes } from "@/constants/routes";

export default function SettingsRoute() {
  return (
    <FoundationScreen
      title="Settings"
      description="Settings shell for account, accessibility, privacy, voice, and integrations."
      nextHref={routes.home}
      nextLabel="Back home"
    />
  );
}
