import { FoundationScreen } from "@/components/ui";
import { routes } from "@/constants/routes";

export default function TalkBackChatRoute() {
  return (
    <FoundationScreen
      title="TalkBack chat"
      description="TalkBack AI chat route shell for grounded questions about the current screen session."
      nextHref={routes.notes}
      nextLabel="Open notes"
    />
  );
}
