import { FoundationScreen } from "@/components/ui";
import { routes } from "@/constants/routes";

export default function HomeRoute() {
  return (
    <FoundationScreen
      title="Home dashboard"
      description="Mobile-first dashboard shell for uploads, recent sessions, notes, and history."
      nextHref={routes.uploadScreenshot}
      nextLabel="Open upload flow"
    />
  );
}
