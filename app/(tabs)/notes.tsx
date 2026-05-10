import { FoundationScreen } from "@/components/ui";
import { routes } from "@/constants/routes";

export default function NotesRoute() {
  return (
    <FoundationScreen
      title="Notes"
      description="Notes shell for saved explanations, reminders, and follow-up questions."
      nextHref={routes.talkbackChat}
      nextLabel="Open TalkBack"
    />
  );
}
